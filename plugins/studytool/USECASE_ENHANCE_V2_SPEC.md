# Use Case Enhancement v2 — Spec

Reference implementation: **`study/algo/index.html`** (after this commit). Compare against
backup `index.html.bak-uc-enhance` to see exactly what changed.

## Goal

Make Use Cases comprehensive and self-contained for learning — a reader should be able
to learn the topic from a single use-case card without external context.

## Schema changes

### Per-step (new optional fields)

```js
{
  title:      "Step Name",
  component:  "Algorithm / Data Structure",
  proto:      "Canonical impl (existing)",
  detail:     "Existing prose paragraph (keep, can expand)",
  code:       "Existing code (keep)",
  // NEW:
  intuition:  "1-line key insight, the 'why this works'",
  complexity: "O(...) — time / space tradeoff",
  example:    "Concrete numbers from a real system",
  pitfall:    "Common mistake or silent failure mode"
}
```

### Per-use-case (new optional fields)

```js
{
  id, title, desc, icon, color, steps: [...],
  // NEW:
  summary:    "<strong>...</strong> 2-3 sentence story tying steps together",
  pipeline:   "ASCII data-flow diagram (whitespace preserved via <pre>-like CSS)",
  metrics:    [ { label: "...", value: "..." }, ... ],  // 3-4 production-scale numbers
  extensions: "Sentence about what to learn after this card"
}
```

## CSS additions

Add the following block right after `.uc-refs a:hover { ... }` rule (search for `border-color: #58a6ff; color: #58a6ff; background: #0d1117;` to find the anchor):

```css
  /* ── Use-case enrichment v2 ── */
  .uc-overview { background: linear-gradient(135deg, #0d1117 0%, #161b22 100%); border: 1px solid #30363d;
    border-left: 3px solid #58a6ff; border-radius: 10px; padding: 16px 18px; margin: 16px 0 20px; }
  .uc-overview .uc-summary { font-size: 13px; color: #c9d1d9; line-height: 1.7; }
  .uc-overview .uc-summary strong { color: #79c0ff; }
  .uc-pipeline { margin-top: 14px; padding: 10px 12px; background: #0d1117; border: 1px solid #30363d;
    border-radius: 6px; font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 11px; color: #7ee787; line-height: 1.6; white-space: pre-wrap; overflow-x: auto; }
  .uc-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-top: 14px; }
  .uc-metric { background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 10px 12px; }
  .uc-metric .uc-metric-label { font-size: 10px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; }
  .uc-metric .uc-metric-value { font-size: 14px; color: #ffa657; font-weight: 600; margin-top: 4px; line-height: 1.4; }
  .uc-extensions { margin-top: 14px; padding: 10px 12px; background: rgba(210, 168, 255, 0.06);
    border: 1px solid rgba(210, 168, 255, 0.25); border-radius: 6px; font-size: 12px; color: #c9d1d9; line-height: 1.6; }
  .uc-extensions strong { color: #d2a8ff; }
  .uc-step .uc-intuition { margin-top: 8px; padding: 8px 10px; background: rgba(126, 231, 135, 0.08);
    border-left: 2px solid #3fb950; border-radius: 4px; font-size: 12px; color: #c9d1d9; line-height: 1.55; display: none; }
  .uc-step.active .uc-intuition { display: block; }
  .uc-step .uc-intuition strong { color: #7ee787; }
  .uc-step .uc-complexity { display: inline-block; margin-top: 8px; margin-right: 6px;
    background: rgba(31, 111, 235, 0.15); border: 1px solid rgba(88, 166, 255, 0.35); border-radius: 4px;
    padding: 2px 8px; font-size: 10px; color: #79c0ff; font-family: 'Cascadia Code', 'Consolas', monospace; }
  .uc-step .uc-pitfall { margin-top: 8px; padding: 8px 10px; background: rgba(255, 123, 114, 0.08);
    border-left: 2px solid #ff7b72; border-radius: 4px; font-size: 12px; color: #c9d1d9; line-height: 1.55; display: none; }
  .uc-step.active .uc-pitfall { display: block; }
  .uc-step .uc-pitfall strong { color: #ff7b72; }
  .uc-step .uc-example { margin-top: 8px; padding: 8px 10px; background: rgba(255, 166, 87, 0.06);
    border-left: 2px solid #ffa657; border-radius: 4px; font-size: 12px; color: #c9d1d9; line-height: 1.55; display: none; }
  .uc-step.active .uc-example { display: block; }
  .uc-step .uc-example strong { color: #ffa657; }
```

## Renderer changes (in `showUseCase` function)

The renderer currently builds HTML with `let html = '<div class="uc-flow">'...`. Find the block
between `<div class="uc-subtitle">${uc.desc}</div>` and the `<div class="uc-flow-controls">` and
insert the overview-panel emission. Then in the per-step loop, add intuition/complexity/example/pitfall.

**Find:**
```js
  html += `<div class="uc-subtitle">${uc.desc}</div>`;
  html += '<div class="uc-flow-controls">';
```

**Replace with:**
```js
  html += `<div class="uc-subtitle">${uc.desc}</div>`;
  if (uc.summary || uc.pipeline || uc.metrics || uc.extensions) {
    html += '<div class="uc-overview">';
    if (uc.summary)   html += `<div class="uc-summary">${uc.summary}</div>`;
    if (uc.pipeline)  html += `<div class="uc-pipeline">${uc.pipeline}</div>`;
    if (uc.metrics && uc.metrics.length) {
      html += '<div class="uc-metrics">';
      uc.metrics.forEach(m => {
        html += `<div class="uc-metric"><div class="uc-metric-label">${m.label}</div><div class="uc-metric-value">${m.value}</div></div>`;
      });
      html += '</div>';
    }
    if (uc.extensions) html += `<div class="uc-extensions"><strong>Where to go next:</strong> ${uc.extensions}</div>`;
    html += '</div>';
  }
  html += '<div class="uc-flow-controls">';
```

**Find** (inside `uc.steps.forEach`):
```js
    let detailHtml = `<p>${step.detail}</p><span class="uc-proto">${step.proto}</span>`;
    if (step.code) detailHtml += `<pre class="uc-code">${step.code}</pre>`;
    if (step.refs && step.refs.length) {
```

**Replace with:**
```js
    let detailHtml = '';
    if (step.intuition) detailHtml += `<div class="uc-intuition"><strong>💡 Intuition:</strong> ${step.intuition}</div>`;
    detailHtml += `<p>${step.detail}</p>`;
    if (step.proto) detailHtml += `<span class="uc-proto">${step.proto}</span>`;
    if (step.complexity) detailHtml += `<span class="uc-complexity">⏱ ${step.complexity}</span>`;
    if (step.code) detailHtml += `<pre class="uc-code">${step.code}</pre>`;
    if (step.example) detailHtml += `<div class="uc-example"><strong>📊 In practice:</strong> ${step.example}</div>`;
    if (step.pitfall) detailHtml += `<div class="uc-pitfall"><strong>⚠ Pitfall:</strong> ${step.pitfall}</div>`;
    if (step.refs && step.refs.length) {
```

## Content guidelines

For **each existing use case**, add:
- `summary`: 2-3 sentences in HTML (use `<strong>` for emphasis) describing the pipeline as a story
- `pipeline`: ASCII data-flow with → arrows and indentation (preserved as-is via white-space: pre-wrap)
- `metrics`: 3-4 production-scale numbers (real systems, real performance)
- `extensions`: one sentence pointing to advanced techniques

For **each step**, add 3 of the 4 new fields (pick whichever apply):
- `intuition`: the "why this works" insight in 1 line
- `complexity`: time/space big-O
- `example`: concrete real-world numbers
- `pitfall`: silent failure mode or common mistake

For **each use case**, optionally add 1-2 NEW use cases relevant to the topic to broaden
coverage. Keep total ≤ 6 per topic to avoid overwhelming the UI.

## Workflow

1. Read the existing `useCases:` block of your assigned file.
2. Apply the CSS additions (one block, fixed location).
3. Apply the two renderer patches.
4. For each existing use case, enrich it with the new fields. Preserve existing fields.
5. Optionally add 1-2 topic-specific new use cases.
6. Validate:
   - `node plugins/studytool/verify_quiz.js <file>` → PASS
   - `node plugins/studytool/verify_config.js <file>` → PASS (usecase-shape should report N cards, all healthy)
7. Report: before/after file size, # use cases, # new use cases added, # steps enriched.

## Safety

- **Save a backup** as `index.html.bak-uc-enhance` before edits.
- Use string `.replace()` for the renderer patches with enough unique context to avoid mis-matches.
- Be wary of backticks in template literal content — escape `\`` as `\\\`` if your content contains them. Or avoid backticks in `summary`/`pipeline`/etc. fields.
- Do NOT touch deepDives, glossary, quiz, problems, or mindmap — scope is use cases only.
- Do NOT change tab registration or view-usecase div.
- If renderer pattern doesn't match exactly (some agents in earlier phases customized the renderer), report and stop — do not free-form rewrite.
