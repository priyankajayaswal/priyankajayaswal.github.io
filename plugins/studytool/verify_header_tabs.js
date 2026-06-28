#!/usr/bin/env node
// verify_header_tabs.js
//
// Checks that a study HTML ships at least 4 content subsections (tabs) in
// the header navigation, excluding the Tracker side-panel toggle.
//
// Reports BOTH the statically-declared tab set (parsed from `tabs.push(...)`
// or `<button class="tab">`) AND the runtime tab set (the tab buttons that
// actually get appended to `#tab-group` after the page's JS runs in jsdom).
// Pages with conditional pushes — e.g. algo / pmpp / maths gate the Appendix
// tab on `C.youtube.videos.length` and their `COURSE_CONFIG` ships no
// `youtube` block — render fewer tabs than they statically declare. The
// runtime count is what the user actually sees.
//
// PASS criterion: runtime tab count >= MIN_TABS (excluding Tracker). When
// jsdom is unavailable the validator falls back to the static count.
//
// Usage:
//   node verify_header_tabs.js <path-to-html> [more paths...]
//
// Exits 0 if all files PASS, 1 if any FAIL.

const fs = require('fs');
const path = require('path');

const MIN_TABS = 4;

// jsdom is required for runtime detection. Resolve from the studytool
// plugin's node_modules so the script works regardless of cwd.
let JSDOM = null, VirtualConsole = null;
try {
  const jsdomPath = require.resolve('jsdom', { paths: [__dirname] });
  ({ JSDOM, VirtualConsole } = require(jsdomPath));
} catch (e) {
  // Leave null; we'll fall back to static-only detection.
}

const isTracker = t =>
  (t.dataView && /tracker/i.test(t.dataView)) ||
  (t.label && /tracker/i.test(t.label));

function parseStaticTabs(html) {
  const tabs = [];
  let m;

  // <button class="tab" data-view="...">label</button>
  const buttonRe = /<button\b[^>]*\bclass\s*=\s*"([^"]*)"[^>]*>([\s\S]*?)<\/button>/g;
  while ((m = buttonRe.exec(html)) !== null) {
    if (!m[1].split(/\s+/).includes('tab')) continue;
    const dv = /\bdata-view\s*=\s*"([^"]+)"/.exec(m[0]);
    const label = m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    tabs.push({ source: 'static', dataView: dv ? dv[1] : null, label });
  }

  // tabs.push({ id: '...', label: '...' })
  if (tabs.length === 0) {
    const pushRe = /\btabs\.push\s*\(\s*\{\s*id\s*:\s*['"]([^'"]+)['"]\s*,\s*label\s*:\s*['"]([^'"]+)['"]/g;
    while ((m = pushRe.exec(html)) !== null) {
      tabs.push({ source: 'dynamic', dataView: m[1], label: m[2] });
    }
  }
  return tabs;
}

function detectRuntimeTabs(html, fileDir) {
  if (!JSDOM) return Promise.resolve(null);
  return new Promise((resolve) => {
    let done = false;
    const finish = (val) => { if (!done) { done = true; resolve(val); } };
    let dom;
    try {
      const vc = new VirtualConsole();
      vc.on('jsdomError', () => {}); // swallow d3/etc resource errors
      dom = new JSDOM(html, {
        runScripts: 'dangerously',
        pretendToBeVisual: true,
        virtualConsole: vc,
        url: 'file:///' + fileDir.replace(/\\/g, '/') + '/',
      });
    } catch (e) {
      return finish(null);
    }
    setTimeout(() => {
      try {
        const d = dom.window.document;
        const buttons = [...d.querySelectorAll('#tab-group .tab, .tab-group .tab')];
        const tabs = buttons.map(b => ({
          source: 'runtime',
          dataView: (b.dataset && b.dataset.view) || null,
          label: (b.textContent || '').trim(),
        }));
        finish(tabs);
      } catch (e) {
        finish(null);
      } finally {
        try { dom.window.close(); } catch (_) {}
      }
    }, 900);
  });
}

async function checkOne(filePath) {
  const issues = [];
  let html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return { file: filePath, ok: false, issues: [`cannot read file: ${e.message}`] };
  }

  const looksLikeMultiTab =
    /class="tab-group"|switchTab\s*\(|<button[^>]*class="[^"]*\btab\b/.test(html);
  if (!looksLikeMultiTab) {
    return { file: filePath, ok: true, skipped: true, issues: [],
      staticCount: 0, runtimeCount: null, contentTabs: '', trackerCount: 0 };
  }

  const staticTabs = parseStaticTabs(html);
  const staticContent = staticTabs.filter(t => !isTracker(t));

  const runtimeTabs = await detectRuntimeTabs(html, path.dirname(path.resolve(filePath)));
  const runtimeContent = runtimeTabs ? runtimeTabs.filter(t => !isTracker(t)) : null;
  const runtimeTracker = runtimeTabs ? runtimeTabs.filter(isTracker) : null;

  // Authoritative count = runtime if jsdom worked, else static.
  const authoritative = runtimeContent || staticContent;
  const kind = runtimeContent ? 'runtime' : 'static';
  const tabNames = authoritative.map(t => t.dataView || t.label || '?').join(', ');

  if (authoritative.length < MIN_TABS) {
    issues.push(
      `header-tabs — found only ${authoritative.length} ${kind} content tab(s); ` +
      `need at least ${MIN_TABS}. Tabs: [${tabNames}].`
    );
  }

  return {
    file: filePath,
    ok: issues.length === 0,
    issues,
    staticCount: staticContent.length,
    staticIds: staticContent.map(t => t.dataView || t.label || '?').join(', '),
    runtimeAvailable: runtimeContent !== null,
    runtimeCount: runtimeContent ? runtimeContent.length : null,
    runtimeIds: runtimeContent ? runtimeContent.map(t => t.dataView || t.label || '?').join(', ') : null,
    contentTabs: tabNames,
    trackerCount: runtimeTracker ? runtimeTracker.length : staticTabs.filter(isTracker).length,
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node verify_header_tabs.js <html> [more...]');
    process.exit(2);
  }
  if (!JSDOM) {
    console.error('[warn] jsdom not found in ' + __dirname + '/node_modules — runtime detection disabled; falling back to static parse.');
  }

  let anyFail = false;
  const summary = [];
  for (const f of args) {
    const r = await checkOne(f);
    const subj = path.basename(path.dirname(f));
    if (r.skipped) {
      console.log(`SKIP  ${f}`);
      console.log(`  \u2014 not a multi-tab study page (no tab-group / switchTab)`);
      summary.push({ subj, status: 'SKIP', staticCount: '-', runtimeCount: '-', ids: '' });
    } else if (r.ok) {
      console.log(`PASS  ${f}`);
      if (r.runtimeAvailable) {
        const delta = r.runtimeCount !== r.staticCount ? `  (static declares ${r.staticCount})` : '';
        console.log(`  \u2713 header-tabs \u2014 ${r.runtimeCount} runtime content tab(s)${delta} (tracker: ${r.trackerCount}) [${r.runtimeIds}]`);
      } else {
        console.log(`  \u2713 header-tabs \u2014 ${r.staticCount} static content tab(s) (tracker: ${r.trackerCount}) [${r.staticIds}]  [jsdom unavailable]`);
      }
      summary.push({
        subj, status: 'PASS',
        staticCount: String(r.staticCount),
        runtimeCount: r.runtimeAvailable ? String(r.runtimeCount) : 'n/a',
        ids: r.runtimeAvailable ? r.runtimeIds : r.staticIds,
      });
    } else {
      anyFail = true;
      console.log(`FAIL  ${f}`);
      for (const msg of r.issues) console.log(`  \u2717 ${msg}`);
      summary.push({
        subj, status: 'FAIL',
        staticCount: String(r.staticCount),
        runtimeCount: r.runtimeAvailable ? String(r.runtimeCount) : 'n/a',
        ids: r.contentTabs,
      });
    }
  }

  // ── Summary table ─────────────────────────────────────────────────────
  if (summary.length > 1) {
    summary.sort((a, b) => a.subj.localeCompare(b.subj));
    const subjW   = Math.max(7, ...summary.map(s => s.subj.length));
    const statusW = 6;
    const colW    = 7;
    console.log('');
    console.log('Header tab counts per HTML  (Runtime = what actually renders in jsdom):');
    console.log('  ' + 'Subject'.padEnd(subjW) + '  ' + 'Status'.padEnd(statusW) + '  ' + 'Static'.padEnd(colW) + '  ' + 'Runtime'.padEnd(colW) + '  IDs (runtime)');
    console.log('  ' + '-'.repeat(subjW) + '  ' + '-'.repeat(statusW) + '  ' + '-'.repeat(colW) + '  ' + '-'.repeat(colW) + '  ' + '-'.repeat(40));
    for (const s of summary) {
      const mismatch = s.staticCount !== '-' && s.runtimeCount !== 'n/a' && s.staticCount !== s.runtimeCount;
      const mark = mismatch ? ' \u26A0' : '';
      console.log('  ' + s.subj.padEnd(subjW) + '  ' + s.status.padEnd(statusW) + '  ' + s.staticCount.padEnd(colW) + '  ' + (s.runtimeCount + mark).padEnd(colW) + '  ' + s.ids);
    }
    const pass = summary.filter(s => s.status === 'PASS').length;
    const skip = summary.filter(s => s.status === 'SKIP').length;
    const fail = summary.filter(s => s.status === 'FAIL').length;
    const mismatch = summary.filter(s =>
      s.staticCount !== '-' && s.runtimeCount !== 'n/a' && s.staticCount !== s.runtimeCount
    );
    console.log('');
    console.log(`Totals: PASS=${pass}  SKIP=${skip}  FAIL=${fail}`);
    if (mismatch.length) {
      console.log(`\u26A0 Static \u2260 Runtime in ${mismatch.length} file(s): ` +
        mismatch.map(s => `${s.subj} (${s.staticCount}\u2192${s.runtimeCount})`).join(', ') +
        ' \u2014 statically-declared tabs are conditionally suppressed at runtime (e.g. missing C.youtube.videos).');
    }
  }

  process.exit(anyFail ? 1 : 0);
}

if (require.main === module) main();

module.exports = { checkOne };
