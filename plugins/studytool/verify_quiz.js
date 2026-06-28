#!/usr/bin/env node
/*
 * verify_quiz.js — guard against silent quiz-module failures.
 *
 * Usage:
 *   node plugins/studytool/verify_quiz.js <path-to-index.html> [...more]
 *   node plugins/studytool/verify_quiz.js study/*\/index.html
 *
 * Exits 0 if all files pass, 1 if any file fails.
 *
 * Supports TWO quiz architectures (auto-detected):
 *
 *   Style A — "template" / JSON-bootstrap:
 *     <script id="quiz-data" type="application/json">[ ... ]</script>
 *     <script>(function(){ const data = JSON.parse(document.getElementById('quiz-data').textContent); function boot(){...} })();</script>
 *     Used by: tpu, algo, compilers, most patched HTMLs.
 *
 *   Style B — "inline COURSE_CONFIG":
 *     C.quiz = [ { q:..., options:..., answer:... }, ... ]   (inside COURSE_CONFIG)
 *     if (C.quiz && C.quiz.length) tabs.push({ id:'quiz', ... });
 *     function renderQuiz() { ... reads C.quiz directly ... }
 *     Used by: pmpp.
 *
 * Catches the two recurring bugs that silently disable the quiz tab:
 *   1. Unclosed <!-- ... --> swallowing the quiz <script> tags as comment text.
 *   2. IIFE script placed before <script id="quiz-data"> in source order, so
 *      document.getElementById('quiz-data') returns null at parse time.
 *
 * Requires: node-html-parser. Install once with:
 *   npm install --prefix plugins/studytool node-html-parser
 */

const fs = require('fs');
const path = require('path');

let parse;
try {
  parse = require('node-html-parser').parse;
} catch (e) {
  // Fall back to a local install relative to this script.
  try {
    parse = require(path.join(__dirname, 'node_modules', 'node-html-parser')).parse;
  } catch (e2) {
    console.error('Missing dep: node-html-parser. Run:');
    console.error('  npm install --prefix plugins/studytool node-html-parser');
    process.exit(2);
  }
}

const RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', DIM = '\x1b[2m', RESET = '\x1b[0m';

function checkFile(filePath) {
  const checks = [];
  const fail = (name, hint) => checks.push({ name, ok: false, hint });
  const pass = (name, info) => checks.push({ name, ok: true, info });

  if (!fs.existsSync(filePath)) {
    return { filePath, checks: [{ name: 'file-exists', ok: false, hint: 'File not found.' }] };
  }
  const h = fs.readFileSync(filePath, 'utf8');

  // ── Out-of-scope SKIP: standalone single-view tools (e.g., arithmetic) have
  // no quiz scaffolding at all. See study/README.md for scope policy.
  const hasAnyQuizMarker =
    /id\s*=\s*["']quiz-data["']/.test(h) ||
    /id\s*=\s*["']view-quiz["']/.test(h) ||
    /tabs\.push\(\s*\{\s*id\s*:\s*['"]quiz['"]/.test(h) ||
    /data-view\s*=\s*["']quiz["']/.test(h);
  if (!hasAnyQuizMarker) {
    return { filePath, skip: true, reason: 'no quiz markers (#quiz-data / #view-quiz / quiz tab) — not a study-tool quiz page' };
  }

  // ── Check 1: balanced HTML comments ──
  const opens = (h.match(/<!--/g) || []).length;
  const closes = (h.match(/-->/g) || []).length;
  if (opens === closes) pass('comments-balanced', `${opens} open / ${closes} close`);
  else fail('comments-balanced',
    `Found ${opens} <!-- but ${closes} -->. An unclosed comment usually swallows the quiz <script> tags. ` +
    `Look for a "DROP-IN QUIZ MODULE" comment without "============================================================ -->" closer.`);

  // Parse the DOM (with comments stripped, which is what a browser sees as script-bearing nodes)
  const root = parse(h, { comment: false });

  // ── Style detection ──
  // Style A: presence of <script id="quiz-data"> in the DOM.
  // Style B: presence of `C.quiz = [...]` (or `quiz: [...]` inside COURSE_CONFIG)
  //          plus `tabs.push({ id: 'quiz', ... })` registration.
  const dataEl = root.querySelector('script#quiz-data');
  const hasStyleATag = !!dataEl;
  const hasInlineQuizArray = /\bquiz\s*:\s*\[/.test(h) || /\bC\.quiz\s*=\s*\[/.test(h);
  const hasQuizTabPush = /tabs\.push\(\s*\{\s*id\s*:\s*['"]quiz['"]/.test(h);
  const hasViewQuizDiv = !!root.querySelector('#view-quiz');
  // Style C — bespoke (e.g., networking): a quiz tab (static <button data-view="quiz">
  // OR dynamic tabs.push({id:'quiz',...})), a #view-quiz div, a top-level
  // `quizQuestions`/`QUIZ_QUESTIONS` const, and a `renderQuiz*`/`quizPool` fn.
  const hasStaticQuizBtn = /<button[^>]*data-view\s*=\s*["']quiz["']/.test(h);
  const hasQuizTabRegistration = hasStaticQuizBtn || hasQuizTabPush;
  const hasBespokeQuizData = /\b(?:quizQuestions|QUIZ_QUESTIONS)\s*=\s*\[/.test(h);
  const hasBespokeQuizFn = /\bfunction\s+(?:renderQuiz\w*|quizPool)\s*\(/.test(h);
  const isStyleC = hasQuizTabRegistration && hasViewQuizDiv && hasBespokeQuizData && hasBespokeQuizFn;
  const style = hasStyleATag
    ? 'A'
    : (hasInlineQuizArray && hasQuizTabPush ? 'B'
       : (isStyleC ? 'C' : 'unknown'));
  pass('quiz-architecture', style === 'A' ? 'Style A (JSON-bootstrap)' :
                            style === 'B' ? 'Style B (inline C.quiz)' :
                            style === 'C' ? 'Style C (bespoke top-level const + renderer)' :
                            'unknown — neither <script id="quiz-data"> nor inline C.quiz pattern found');

  if (style === 'unknown') {
    fail('quiz-detected',
      `No recognized quiz module found. Expected either:\n` +
      `      (A) <script id="quiz-data" type="application/json"> + IIFE boot; or\n` +
      `      (B) C.quiz=[...] inside COURSE_CONFIG + tabs.push({id:'quiz',...}) + a renderQuiz()/quizPool() function; or\n` +
      `      (C) Bespoke: <button data-view="quiz"> + #view-quiz + quizQuestions=[...] + renderQuiz*()/quizPool().\n` +
      `      Either the module is missing, mistyped, or trapped inside an unclosed HTML comment.`);
    return { filePath, checks };
  }

  if (style === 'C') {
    pass('quiz-view-div', '#view-quiz present');
    pass('quiz-tab-registered', hasStaticQuizBtn ? 'static <button data-view="quiz">' : 'dynamic tabs.push({id:"quiz"})');
    const m = h.match(/\b(?:quizQuestions|QUIZ_QUESTIONS)\s*=\s*\[([\s\S]*?)\n\];/);
    if (m) {
      const itemCount = (m[1].match(/\{\s*(?:topic|q|question)\s*:/g) || []).length;
      if (itemCount > 0) pass('quiz-data-questions', `${itemCount} questions (bespoke const)`);
      else pass('quiz-data-questions', 'bespoke const present (count heuristic failed)');
    } else {
      pass('quiz-data-questions', 'bespoke const present');
    }
    return { filePath, checks };
  }

  if (style === 'A') {
    // ── A.1: quiz-data exists ──
    pass('quiz-data-in-DOM', 'script#quiz-data present');

    // ── A.2: JSON parses and has ≥1 question ──
    try {
      const parsed = JSON.parse((dataEl.text || '').trim() || '[]');
      const qCount = Array.isArray(parsed) ? parsed.length : 0;
      if (qCount > 0) pass('quiz-data-questions', `${qCount} questions`);
      else fail('quiz-data-questions', 'JSON parsed but contained 0 questions. Add quiz items.');
    } catch (e) {
      fail('quiz-data-questions', `JSON parse error: ${e.message}`);
    }

    // ── A.3: IIFE module present in DOM ──
    let iifeEl = null;
    for (const sc of root.querySelectorAll('script')) {
      if (/document\.getElementById\(\s*['"]quiz-data['"]\s*\)/.test(sc.text) &&
          /function\s+boot\s*\(/.test(sc.text)) {
        iifeEl = sc; break;
      }
    }
    if (iifeEl) pass('iife-in-DOM', 'quiz IIFE script present');
    else fail('iife-in-DOM',
      `No quiz IIFE <script> in the DOM (looking for getElementById('quiz-data') + function boot(). ` +
      `Either the module is missing, or trapped in an unclosed comment.`);

    // ── A.4: data script comes BEFORE iife in source order ──
    const dataIdx = h.search(/<script\s+id=["']quiz-data["']/);
    const iifeIdx = h.indexOf("document.getElementById('quiz-data')");
    if (dataIdx >= 0 && iifeIdx >= 0) {
      if (dataIdx < iifeIdx) pass('data-before-iife', `data@${dataIdx} < iife@${iifeIdx}`);
      else fail('data-before-iife',
        `IIFE at byte ${iifeIdx} appears before <script id="quiz-data"> at byte ${dataIdx}. ` +
        `The IIFE runs synchronously when the parser hits its closing </script>, so the data element ` +
        `must already be in the DOM. Move the <script id="quiz-data">...</script> block to come BEFORE ` +
        `the <script>(function(){...})()</script> IIFE block.`);
    } else {
      fail('data-before-iife', '(skipped: data or iife not found in source)');
    }
  } else {
    // Style B — inline C.quiz inside COURSE_CONFIG.

    // ── B.1: #view-quiz div exists ──
    if (hasViewQuizDiv) pass('view-quiz-div', '<div id="view-quiz"> present');
    else fail('view-quiz-div',
      `No <div id="view-quiz"> in the DOM. The quiz tab needs a view container to render into.`);

    // ── B.2: tab registration line present ──
    pass('quiz-tab-registered', `tabs.push({ id: 'quiz', ... }) found`);

    // ── B.3: count quiz questions inside the C.quiz / quiz: array ──
    // Find the quiz array block; tolerate either `quiz: [` (inside config object)
    // or `C.quiz = [` (post-config assignment). We balance brackets to grab the array body.
    let qCount = 0, arrayStart = -1, openTok = null;
    const m1 = /\bquiz\s*:\s*\[/.exec(h);
    const m2 = /\bC\.quiz\s*=\s*\[/.exec(h);
    if (m1 && (!m2 || m1.index < m2.index)) { arrayStart = m1.index + m1[0].length - 1; openTok = 'quiz:'; }
    else if (m2) { arrayStart = m2.index + m2[0].length - 1; openTok = 'C.quiz='; }
    if (arrayStart >= 0) {
      let depth = 0, i = arrayStart, end = -1;
      for (; i < h.length; i++) {
        const ch = h[i];
        if (ch === '[') depth++;
        else if (ch === ']') { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end > arrayStart) {
        const body = h.slice(arrayStart + 1, end);
        // Count top-level object literals: `{ ... q: ... }` separated by commas.
        // A robust enough heuristic: count `{` characters at depth==1 of the outer array
        // by tracking nested braces.
        let bdepth = 0;
        for (let j = 0; j < body.length; j++) {
          const c = body[j];
          if (c === '{') { if (bdepth === 0) qCount++; bdepth++; }
          else if (c === '}') bdepth--;
        }
      }
    }
    if (qCount > 0) pass('quiz-data-questions', `${qCount} questions (${openTok} array)`);
    else fail('quiz-data-questions',
      `Found tab registration but no parseable quiz array entries. Looked for \`quiz: [{...}, ...]\` ` +
      `inside COURSE_CONFIG or \`C.quiz = [{...}, ...]\` post-config. Ensure at least one entry exists.`);

    // ── B.4: a render function reads C.quiz ──
    const hasRenderRef = /\bC\.quiz\b/.test(h) && /function\s+(?:renderQuiz|quizPool|quizTopics)\s*\(/.test(h);
    if (hasRenderRef) pass('quiz-render-fn', 'render function references C.quiz');
    else fail('quiz-render-fn',
      `No quiz renderer found that reads C.quiz. Expected a function like renderQuiz() or quizPool() ` +
      `that references C.quiz to drive the #view-quiz tab.`);
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
  console.error('Usage: node verify_quiz.js <path-to-index.html> [...]');
  process.exit(2);
}

let anyFail = false;
for (const f of args) {
  const r = checkFile(f);
  if (!printReport(r)) anyFail = true;
}
console.log('');
process.exit(anyFail ? 1 : 0);
