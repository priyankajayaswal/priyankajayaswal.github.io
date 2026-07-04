#!/usr/bin/env node
/*
 * verify_config.js — guard against silent COURSE_CONFIG breakage.
 *
 * Usage:
 *   node plugins/studytool/verify_config.js <path-to-index.html> [...]
 *
 * Exits 0 if all files pass, 1 if any file fails.
 *
 * verify_quiz.js handles the quiz module wiring. This script handles the
 * other silent-failure modes that surfaced while authoring 18+ courses:
 *
 *   1. COURSE_CONFIG has a trailing-comma / brace error and silently
 *      fails to parse — the page renders but tabs are missing.
 *   2. A Deep Dive card has no `svg` function or returns an empty string.
 *   3. A Deep Dive uses a legacy schema (`{heading, body}`, `markdown:`,
 *      `cards:[{term, detail}]`) that the renderer ignores.
 *   4. A Use Case has no `steps`, or a step is missing `title`.
 *   5. A Practice problem section has zero items.
 *
 * No external deps — we extract the COURSE_CONFIG block as a string and
 * eval it inside Node's `vm` sandbox.
 */

const fs = require('fs');
const vm = require('vm');

const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', RESET = '\x1b[0m';

function extractConfig(html) {
  // Find `const COURSE_CONFIG = {` (modern) or `const C = {` (legacy) … matching `};`
  const startMatch =
    html.match(/const\s+COURSE_CONFIG\s*=\s*\{/) ||
    html.match(/const\s+C\s*=\s*\{/);
  if (startMatch) {
    const startIdx = startMatch.index + startMatch[0].length - 1; // point at `{`
    const block = sliceBalanced(html, startMatch.index, startIdx);
    if (!block) return null;
    return block.replace(/^const\s+\w+\s*=/, 'const COURSE_CONFIG =') + ';';
  }
  // Bespoke legacy: top-level `const deepDives = [...]`, `const useCases = [...]`,
  // possibly `const quizQuestions = [...]` instead of a single COURSE_CONFIG.
  const parts = ['const COURSE_CONFIG = {'];
  let any = false;
  for (const key of ['deepDives', 'useCases', 'problems']) {
    const m = html.match(new RegExp('const\\s+' + key + '\\s*=\\s*\\[', 'm'));
    if (!m) continue;
    const startIdx = m.index + m[0].length - 1; // point at `[`
    const arrSrc = sliceBalancedArray(html, m.index, startIdx);
    if (arrSrc) {
      const just = arrSrc.replace(/^const\s+\w+\s*=\s*/, '');
      parts.push('  ' + key + ': ' + just + ',');
      any = true;
    }
  }
  parts.push('};');
  return any ? parts.join('\n') : null;
}

function sliceBalanced(html, startIdx, openIdx) {
  // Robust slicer that understands: strings ("..", '..'), template literals
  // (`..` with ${...} interpolation, possibly nested), line/block comments,
  // and regex literals. Required for files with rich SVG-generating template
  // literals (e.g., sanskrit-learning).
  //
  // Context stack entries: { type: 'js'|'tpl'|'expr', anchorDepth?: number }.
  // 'expr' remembers the brace depth at entry so we pop back to 'tpl' when
  // depth returns to anchorDepth on a '}'.
  const stack = [{ type: 'js' }];
  let depth = 0;
  let i = openIdx;
  let prevSig = '';
  for (; i < html.length; i++) {
    const top = stack[stack.length - 1];
    const c = html[i], c2 = html[i + 1];

    if (top.type === 'tpl') {
      if (c === '\\') { i++; continue; }
      if (c === '`')  { stack.pop(); continue; }
      if (c === '$' && c2 === '{') { stack.push({ type: 'expr', anchorDepth: depth }); i++; continue; }
      continue;
    }

    // String literals
    if (c === '"' || c === "'") {
      const q = c; i++;
      while (i < html.length) {
        if (html[i] === '\\') { i += 2; continue; }
        if (html[i] === q) break;
        i++;
      }
      prevSig = q;
      continue;
    }
    if (c === '`') { stack.push({ type: 'tpl' }); prevSig = '`'; continue; }

    // Comments
    if (c === '/' && c2 === '/') {
      i += 2;
      while (i < html.length && html[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && c2 === '*') {
      i += 2;
      while (i < html.length && !(html[i] === '*' && html[i + 1] === '/')) i++;
      i += 1; // land on '/' so for-loop step moves past it
      continue;
    }

    // Regex literal — '/' after an operator/keyword context
    if (c === '/' && !/[\w\)\]\}'"`]/.test(prevSig)) {
      i++;
      let inClass = false;
      while (i < html.length) {
        if (html[i] === '\\') { i += 2; continue; }
        if (html[i] === '[') inClass = true;
        else if (html[i] === ']') inClass = false;
        else if (html[i] === '/' && !inClass) break;
        else if (html[i] === '\n') break; // malformed regex; bail
        i++;
      }
      prevSig = '/';
      continue;
    }

    if (c === '{') {
      depth++;
      prevSig = '{';
      continue;
    }
    if (c === '}') {
      if (top.type === 'expr' && depth === top.anchorDepth) {
        stack.pop(); // back to 'tpl'
        prevSig = '}';
        continue;
      }
      depth--;
      if (depth === 0 && top.type === 'js') { i++; break; }
      prevSig = '}';
      continue;
    }

    if (!/\s/.test(c)) prevSig = c;
  }
  return depth === 0 ? html.slice(startIdx, i) : null;
}

function sliceBalancedArray(html, startIdx, openIdx) {
  let depth = 0, i = openIdx, inStr = null, esc = false;
  for (; i < html.length; i++) {
    const c = html[i];
    if (esc) { esc = false; continue; }
    if (inStr) { if (c === '\\') esc = true; else if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { i++; break; } }
  }
  return depth === 0 ? html.slice(startIdx, i) : null;
}

function evalConfig(src) {
  const htmlEscape = (code) => String(code)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const sandbox = {
    COURSE_CONFIG: null,
    ddCode(lang, code) {
      return `<pre data-lang="${lang}"><code>${htmlEscape(code)}</code></pre>`;
    },
    ddRevList(items) {
      return `<ul>${(items || []).map((it) => `<li>${it}</li>`).join('')}</ul>`;
    },
    ddPractice(items) {
      return `<div>${(items || []).map((it) => `<section><h4>${it.q || ''}</h4><p>${it.a || ''}</p></section>`).join('')}</div>`;
    },
    chapTile(w = 360, h = 210, ch = 1, color = '#58a6ff', icon = '', title = '', bullets = []) {
      const safeTitle = String(title).replace(/[<>&]/g, '');
      const rows = (bullets || []).slice(0, 4).map((b, i) =>
        `<text x="24" y="${72 + i * 20}" fill="#c9d1d9" font-size="12">${String(b).replace(/[<>&]/g, '')}</text>`
      ).join('');
      return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><rect width="${w}" height="${h}" fill="#0d1117"/><text x="24" y="36" fill="${color}" font-size="18">${icon} ${safeTitle || `Chapter ${ch}`}</text>${rows}</svg>`;
    }
  };
  try {
    vm.runInNewContext(src + '\nthis.COURSE_CONFIG = COURSE_CONFIG;', sandbox, { timeout: 1000 });
    return { ok: true, cfg: sandbox.COURSE_CONFIG };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

function applyKnownAugmenters(html, cfg) {
  const start = html.search(/function\s+add[A-Za-z0-9_]*DeepDives\s*\(/);
  if (start < 0) return;
  const afterStart = html.slice(start);
  const endRel = afterStart.search(/\/\/\s+[\S\s]{0,20}Sample data/);
  if (endRel < 0) return;
  const code = afterStart.slice(0, endRel);
  const sandbox = {
    COURSE_CONFIG: cfg,
    console: { log() {}, warn() {}, error() {} }
  };
  try {
    vm.runInNewContext(code, sandbox, { timeout: 1000 });
  } catch (e) {
    // Keep augmentation failures visible in normal page syntax/runtime checks;
    // this verifier should still validate the base COURSE_CONFIG.
  }
}

function checkFile(filePath) {
  const checks = [];
  const fail = (name, hint) => checks.push({ name, ok: false, hint });
  const pass = (name, info) => checks.push({ name, ok: true, info });

  if (!fs.existsSync(filePath)) {
    return { filePath, checks: [{ name: 'file-exists', ok: false, hint: 'File not found.' }] };
  }
  const html = fs.readFileSync(filePath, 'utf8');

  // ── Out-of-scope SKIP: pages with no COURSE_CONFIG and no multi-tab markers
  // are standalone tools (e.g., arithmetic). See study/README.md for scope.
  const hasConfigDecl = /\bconst\s+COURSE_CONFIG\s*=/.test(html);
  const hasMultiTabMarkers =
    /class\s*=\s*["']tab-group["']/.test(html) ||
    /switchTab\s*\(/.test(html) ||
    /<button[^>]*class\s*=\s*["']tab["']/.test(html);
  if (!hasConfigDecl && !hasMultiTabMarkers) {
    return { filePath, skip: true, reason: 'no COURSE_CONFIG and no multi-tab markers — standalone tool, out of scope' };
  }

  // ── Check 1: COURSE_CONFIG block is extractable ──
  const src = extractConfig(html);
  if (!src) {
    fail('config-extract',
      'No `const COURSE_CONFIG = { ... };` block found, or braces are unbalanced. ' +
      'If the file uses a legacy `const C = {...}` shape, migrate to COURSE_CONFIG.');
    return { filePath, checks };
  }
  pass('config-extract', `${src.length} bytes`);

  // ── Check 2: COURSE_CONFIG evaluates ──
  const evalRes = evalConfig(src);
  if (!evalRes.ok) {
    fail('config-evaluates',
      `eval failed: ${evalRes.err}. Common cause: trailing comma after the last array, ` +
      'or a missing comma between two top-level keys (e.g., between `problems: [...]` and `quiz: [...]`). ' +
      'Open the block in an editor with bracket-matching to find the offending position.');
    return { filePath, checks };
  }
  const cfg = evalRes.cfg;
  applyKnownAugmenters(html, cfg);
  pass('config-evaluates', 'COURSE_CONFIG parsed cleanly');

  // ── Check 3: Deep Dive shape ──
  if (Array.isArray(cfg.deepDives) && cfg.deepDives.length > 0) {
    const issues = [];
    cfg.deepDives.forEach((dd, i) => {
      const tag = `deepDives[${i}] (${dd.id || dd.title || '?'})`;
      if (typeof dd.svg !== 'function') {
        issues.push(`${tag}: missing svg() function`);
      } else {
        let out = '';
        try { out = dd.svg(600, 300) || ''; } catch (e) { issues.push(`${tag}: svg() threw — ${e.message}`); }
        if (typeof out !== 'string' || out.indexOf('<svg') === -1) {
          issues.push(`${tag}: svg() returned non-SVG output`);
        } else if (out.length < 80) {
          issues.push(`${tag}: svg() returned suspiciously short output (${out.length} chars) — likely a placeholder`);
        }
      }
      // Detect legacy shapes
      if (Array.isArray(dd.cards)) issues.push(`${tag}: uses legacy 'cards:[{term,detail}]' — migrate to sections/keypoints`);
      if (typeof dd.markdown === 'string') issues.push(`${tag}: uses legacy 'markdown:' field — migrate to sections`);
      if (Array.isArray(dd.sections)) {
        dd.sections.forEach((s, j) => {
          if (s.heading || s.body) issues.push(`${tag}.sections[${j}]: uses legacy {heading,body} — rename to {title,text}`);
          if (!s.title) issues.push(`${tag}.sections[${j}]: missing title`);
          if (!s.text && !s.formula) issues.push(`${tag}.sections[${j}]: needs either text or formula`);
        });
        if (dd.sections.length < 3) issues.push(`${tag}: only ${dd.sections.length} section(s); aim for 4 (Intuition / Mechanism / Worked Example / Pitfall+Tie-In)`);
      } else {
        issues.push(`${tag}: missing sections[]`);
      }
      if (Array.isArray(dd.keypoints)) {
        if (dd.keypoints.length < 3) issues.push(`${tag}: only ${dd.keypoints.length} keypoint(s); aim for 4–6`);
      } else {
        issues.push(`${tag}: missing keypoints[]`);
      }
    });
    if (issues.length === 0) pass('deepdive-shape', `${cfg.deepDives.length} cards, all healthy`);
    else fail('deepdive-shape', issues.slice(0, 8).join('\n      ') + (issues.length > 8 ? `\n      ...and ${issues.length-8} more` : ''));
  } else {
    pass('deepdive-shape', 'no deepDives — skipped');
  }

  // ── Check 4: Use Cases shape ──
  if (Array.isArray(cfg.useCases) && cfg.useCases.length > 0) {
    const issues = [];
    cfg.useCases.forEach((uc, i) => {
      const tag = `useCases[${i}] (${uc.id || uc.title || '?'})`;
      if (!Array.isArray(uc.steps) || uc.steps.length === 0) {
        issues.push(`${tag}: missing or empty steps[]`);
      } else {
        uc.steps.forEach((s, j) => {
          if (!s.title) issues.push(`${tag}.steps[${j}]: missing title`);
        });
      }
    });
    if (issues.length === 0) pass('usecase-shape', `${cfg.useCases.length} cases, all healthy`);
    else fail('usecase-shape', issues.join('\n      '));

    // ── Check 4b: Use Cases are wired into the host page ──
    // A file may have useCases data but be an older template lacking the
    // #view-usecase container / tab push / renderer (the tab silently never
    // appears). Some bespoke pages (e.g. networking) use a hand-rolled tab
    // mechanism instead of `tabs.push`, so we only flag if the view div
    // AND renderer are both missing.
    const hasViewDiv = /id=["']view-usecase["']/.test(html);
    const hasTabPush = /tabs\.push\(\s*\{\s*id:\s*['"]usecase['"]/.test(html);
    const hasRenderer = /function\s+showUseCase\s*\(/.test(html);
    if (!hasViewDiv && !hasRenderer) {
      fail('usecase-wiring',
        `useCases data present but host page missing both #view-usecase ` +
        `container and showUseCase() renderer — older template. Port use-case ` +
        `CSS / view div / tab push / renderer from template.html.`);
    } else if (!hasViewDiv || !hasRenderer) {
      const missing = [];
      if (!hasViewDiv) missing.push('#view-usecase container');
      if (!hasRenderer) missing.push('showUseCase() renderer');
      fail('usecase-wiring', `partial wiring — missing: ${missing.join(', ')}`);
    } else if (!hasTabPush) {
      pass('usecase-wiring', 'view + renderer present (bespoke tab wiring assumed)');
    } else {
      pass('usecase-wiring', 'tab + view + renderer all present');
    }
  } else {
    pass('usecase-shape', 'no useCases — skipped');
  }

  // ── Check 5: Problem sections shape ──
  if (Array.isArray(cfg.problems) && cfg.problems.length > 0) {
    const issues = [];
    let withoutHint = 0, totalItems = 0;
    cfg.problems.forEach((sec, i) => {
      const tag = `problems[${i}] (${sec.title || sec.week || '?'})`;
      if (!Array.isArray(sec.items) || sec.items.length === 0) {
        issues.push(`${tag}: missing or empty items[]`);
      } else {
        sec.items.forEach(it => { totalItems++; if (!it.hint) withoutHint++; });
      }
    });
    if (issues.length === 0) {
      const hintPct = totalItems > 0 ? Math.round(100 * (totalItems - withoutHint) / totalItems) : 0;
      const info = `${cfg.problems.length} sections, ${totalItems} items (${hintPct}% have hints)`;
      if (hintPct < 50 && totalItems >= 4) {
        // Soft warning, not a fail
        checks.push({ name: 'problem-shape', ok: true, info: info + ` ${YELLOW}— consider adding hints; the convention is hint on every item${RESET}` });
      } else {
        pass('problem-shape', info);
      }
    } else {
      fail('problem-shape', issues.join('\n      '));
    }
  } else {
    pass('problem-shape', 'no problems — skipped');
  }

  return { filePath, checks };
}

function printReport(report) {
  if (report.skip) {
    console.log(`\n${YELLOW}SKIP${RESET}  ${report.filePath}`);
    console.log(`  ${DIM}— ${report.reason}${RESET}`);
    return true;
  }
  const allOk = report.checks.every(c => c.ok);
  const tag = allOk ? `${GREEN}PASS${RESET}` : `${RED}FAIL${RESET}`;
  console.log(`\n${tag}  ${report.filePath}`);
  for (const c of report.checks) {
    if (c.ok) console.log(`  ${GREEN}✓${RESET} ${c.name}${c.info ? DIM + ' — ' + c.info + RESET : ''}`);
    else console.log(`  ${RED}✗${RESET} ${c.name}\n    ${YELLOW}hint:${RESET} ${c.hint}`);
  }
  return allOk;
}

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Usage: node verify_config.js <path-to-index.html> [...]');
  process.exit(2);
}

let anyFail = false;
for (const f of args) {
  const r = checkFile(f);
  if (!printReport(r)) anyFail = true;
}
console.log('');
process.exit(anyFail ? 1 : 0);
