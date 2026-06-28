// patch_reveal_v2.js - upgrade Practice tab's single-hint reveal to 3-tier (Hint / Approach / Answer)
// Usage: node patch_reveal_v2.js <path-to-index.html> [...more files]
'use strict';
const fs = require('fs');

const OLD_CSS = `  .prob-revealbtn { background: transparent; border: 1px dashed #30363d; color: #8b949e; padding: 3px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; transition: all .15s; }
  .prob-revealbtn:hover { border-color: #d2a8ff; color: #d2a8ff; border-style: solid; }
  .prob-hint { display: none; margin-top: 8px; padding: 8px 12px; background: #161b22; border-left: 2px solid #d2a8ff; border-radius: 4px; color: #c9d1d9; font-size: 12.5px; line-height: 1.55; }
  .prob-hint.shown { display: block; }
  .prob-hint::before { content: '💡 '; }`;

const NEW_CSS = `  .prob-revealbtn { background: transparent; border: 1px dashed #30363d; color: #8b949e; padding: 3px 10px; border-radius: 12px; font-size: 11px; cursor: pointer; transition: all .15s; }
  .prob-revealbtn:hover { border-color: #d2a8ff; color: #d2a8ff; border-style: solid; }
  .prob-revealbtn.approach:hover { border-color: #79c0ff; color: #79c0ff; }
  .prob-revealbtn.answer:hover   { border-color: #7ee787; color: #7ee787; }
  .prob-reveal-panel { display: none; margin-top: 8px; padding: 10px 14px; background: #161b22; border-radius: 4px; color: #c9d1d9; font-size: 12.5px; line-height: 1.65; }
  .prob-reveal-panel.shown { display: block; }
  .prob-reveal-panel ul, .prob-reveal-panel ol { margin: 4px 0 4px 18px; padding: 0; }
  .prob-reveal-panel li { margin: 3px 0; }
  .prob-reveal-panel code { background: #0d1117; padding: 1px 5px; border-radius: 3px; font-size: 11.5px; color: #79c0ff; font-family: 'Cascadia Code', 'Consolas', monospace; }
  .prob-reveal-panel strong { color: #e6edf3; }
  .prob-reveal-panel .rh-label { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .6px; margin-right: 8px; padding: 1px 6px; border-radius: 4px; vertical-align: middle; }
  .prob-hint     { border-left: 2px solid #d2a8ff; }
  .prob-hint     .rh-label { background: #d2a8ff22; color: #d2a8ff; }
  .prob-approach { border-left: 2px solid #79c0ff; }
  .prob-approach .rh-label { background: #79c0ff22; color: #79c0ff; }
  .prob-answer   { border-left: 2px solid #7ee787; background: #0d1f17; }
  .prob-answer   .rh-label { background: #7ee78722; color: #7ee787; }`;

const OLD_INTRO = `    Hints are hidden by default — click <em>Reveal hint</em> only after you've tried.`;
const NEW_INTRO = `    Reveals come in three layers: <strong style="color:#d2a8ff">💡 hint</strong> (nudge) · <strong style="color:#79c0ff">🔑 approach</strong> (how to attack) · <strong style="color:#7ee787">📐 answer</strong> (the result). Try the problem before peeking.`;

const OLD_RENDER = `      if (p.hint) html += \`<div class="pc-actions">
          <button class="prob-revealbtn" data-action="hint">💡 Reveal hint</button>
        </div>
        <div class="prob-hint\${st.hintShown?' shown':''}">\${p.hint}</div>\`;
      html += \`</div>\`;`;

const NEW_RENDER = `      const reveals = [];
      if (p.hint)     reveals.push({ kind:'hint',     label:'💡 Reveal hint',   field:'hint',     btnCls:'',          panelCls:'prob-hint',     tag:'Hint' });
      if (p.approach) reveals.push({ kind:'approach', label:'🔑 Show approach', field:'approach', btnCls:'approach',  panelCls:'prob-approach', tag:'Approach' });
      if (p.answer)   reveals.push({ kind:'answer',   label:'📐 Show answer',   field:'answer',   btnCls:'answer',    panelCls:'prob-answer',   tag:'Answer' });
      if (reveals.length) {
        html += \`<div class="pc-actions">\`;
        reveals.forEach(r => {
          const shown = st[r.kind+'Shown'];
          html += \`<button class="prob-revealbtn \${r.btnCls}" data-action="\${r.kind}" \${shown?'style="display:none"':''}>\${r.label}</button>\`;
        });
        html += \`</div>\`;
        reveals.forEach(r => {
          const shown = st[r.kind+'Shown'];
          html += \`<div class="prob-reveal-panel \${r.panelCls}\${shown?' shown':''}" data-panel="\${r.kind}"><span class="rh-label">\${r.tag}</span>\${p[r.field]}</div>\`;
        });
      }
      html += \`</div>\`;`;

const OLD_HANDLER = `    const revealBtn = card.querySelector('[data-action="hint"]');
    if (revealBtn) revealBtn.addEventListener('click', () => {
      const hintEl = card.querySelector('.prob-hint');
      hintEl.classList.add('shown');
      revealBtn.style.display = 'none';
      const key = card.dataset.key;
      const st = _probState[key] || {};
      st.hintShown = true; _probState[key] = st; probSaveState(_probState);
    });
    // Hide reveal button if already shown
    const key = card.dataset.key;
    if (_probState[key] && _probState[key].hintShown && revealBtn) revealBtn.style.display = 'none';
  });`;

// Some agents stripped the "Hide reveal button if already shown" comment
const OLD_HANDLER_B = `    const revealBtn = card.querySelector('[data-action="hint"]');
    if (revealBtn) revealBtn.addEventListener('click', () => {
      const hintEl = card.querySelector('.prob-hint');
      hintEl.classList.add('shown');
      revealBtn.style.display = 'none';
      const key = card.dataset.key;
      const st = _probState[key] || {};
      st.hintShown = true; _probState[key] = st; probSaveState(_probState);
    });
    const key = card.dataset.key;
    if (_probState[key] && _probState[key].hintShown && revealBtn) revealBtn.style.display = 'none';
  });`;

const NEW_HANDLER = `    const revealBtns = card.querySelectorAll('[data-action="hint"],[data-action="approach"],[data-action="answer"]');
    revealBtns.forEach(btn => btn.addEventListener('click', () => {
      const kind = btn.dataset.action;
      const panel = card.querySelector(\`.prob-reveal-panel[data-panel="\${kind}"]\`);
      if (panel) panel.classList.add('shown');
      btn.style.display = 'none';
      const key = card.dataset.key;
      const st = _probState[key] || {};
      st[kind+'Shown'] = true; _probState[key] = st; probSaveState(_probState);
    }));
  });`;

const OLD_SPOT = `    \${p.hint ? \`<details style="margin-top:12px"><summary style="cursor:pointer;color:#d2a8ff;font-size:12px">💡 Reveal hint</summary><div class="prob-hint shown" style="margin-top:8px">\${p.hint}</div></details>\` : ''}`;
const NEW_SPOT = `    \${(()=>{const L=[];if(p.hint)L.push({s:'💡 Reveal hint',c:'prob-hint',t:'Hint',b:p.hint});if(p.approach)L.push({s:'🔑 Show approach',c:'prob-approach',t:'Approach',b:p.approach});if(p.answer)L.push({s:'📐 Show answer',c:'prob-answer',t:'Answer',b:p.answer});return L.map(l=>\`<details style="margin-top:10px"><summary style="cursor:pointer;color:#8b949e;font-size:12px;padding:4px 0">\${l.s}</summary><div class="prob-reveal-panel \${l.c} shown" style="margin-top:6px"><span class="rh-label">\${l.t}</span>\${l.b}</div></details>\`).join('');})()}`;

const replacements = [
  ['css', OLD_CSS, NEW_CSS],
  ['intro', OLD_INTRO, NEW_INTRO],
  ['render', OLD_RENDER, NEW_RENDER],
  ['handler', [OLD_HANDLER, OLD_HANDLER_B], NEW_HANDLER],
  ['spot', OLD_SPOT, NEW_SPOT],
];

const files = process.argv.slice(2);
if (!files.length) { console.error('usage: node patch_reveal_v2.js <file>...'); process.exit(2); }

let allOk = true;
for (const f of files) {
  let raw = fs.readFileSync(f, 'utf8');
  const usesCRLF = raw.includes('\r\n');
  // Normalize to LF for matching; convert back if needed
  let c = usesCRLF ? raw.replace(/\r\n/g, '\n') : raw;
  // Idempotency: if new CSS already present, skip
  if (c.includes('.prob-reveal-panel { display: none')) {
    console.log(`SKIP ${f} (already patched)`);
    continue;
  }
  const report = [];
  let ok = true;
  for (const [name, oldS, newS] of replacements) {
    const olds = Array.isArray(oldS) ? oldS : [oldS];
    const found = olds.find(o => c.includes(o));
    if (!found) { report.push(`  MISS ${name}`); ok = false; continue; }
    const before = c.length;
    c = c.replace(found, newS);
    report.push(`  OK   ${name} (+${c.length - before} bytes)`);
  }
  if (ok) {
    const out = usesCRLF ? c.replace(/\n/g, '\r\n') : c;
    fs.writeFileSync(f, out, 'utf8');
    console.log(`PATCH ${f}`);
  } else {
    console.log(`FAIL ${f} (no changes written)`);
    allOk = false;
  }
  report.forEach(r => console.log(r));
}
process.exit(allOk ? 0 : 1);
