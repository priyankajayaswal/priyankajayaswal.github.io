# Study Tool Generator — Prompt Playbook

A step-by-step guide for Copilot to generate an interactive study website.

> **Security note:** any page that interpolates *external* data (user input, fetched JSON, Drive sync, URL params) into the DOM MUST use `textContent` — never `innerHTML` template strings — and SHOULD declare a `<meta http-equiv="Content-Security-Policy">` whitelisting only the CDNs it actually loads.

**Live example**: [CS 144 Computer Networking](https://priyankajayaswal.github.io/networking/)
**Template**: See `template.html` in this folder
**Config schema**: See `README.md` for full COURSE_CONFIG reference

---

## Prerequisites
- A folder with course materials (lecture PDFs, notes, etc.)
- (Optional) YouTube playlist URL
- (Optional) README.md with course info

---

## Step 1: Explore Course Content
**Prompt**: "Refer this folder `<path>` and list all the lecture materials, their topics, and weekly structure."

**What Copilot does**:
- Reads folder structure (PDFs, notes, resources)
- Extracts weekly topics from filenames
- Identifies course name, term, structure

**Output**: A summary of course content organized by week/unit.

---

## Step 2: Create Interactive Mind Map (Tab 1 — 📐 Mind Map)
**Prompt**: "Create an interactive mind map of the topics taught in the course."

**What Copilot does**:
- Builds a collapsible D3.js tree from the weekly topic structure
- Each week is a branch, subtopics are children
- Adds tooltips with descriptions for each node
- Adds slide references to link back to lecture PDFs
- Includes expand/collapse all, reset view controls
- Adds clickable legend for filtering by depth

**Output**: Self-contained HTML file with D3.js mind map.

---

## Step 3: Add Topic Interrelation Graph (Tab 2 — 🔗 Topic Graph)
**Prompt**: "Add a new tab to create a graph of interrelation between the core topics."

**What Copilot does**:
- Creates force-directed graph with nodes for key concepts
- Groups nodes into categories (e.g., Transport, Network, Application)
- Adds directed edges showing relationships (depends, enables, implements, related)
- Color-coded by category with clickable legend
- Edge labels showing relationship type
- Toggle edge labels button, reset view

**Output**: Second tab with force-directed topic graph.

---

## Step 4: Add Learning Path (🧭 Learning Path panel)
**Prompt**: "Add a learning path guide to the Topic Graph tab."

**What Copilot does**:
- Creates a sidebar panel with sequential learning steps
- Each step highlights relevant nodes on the graph
- Auto-play feature to walk through steps
- Step badges on graph nodes
- Close button, pause/resume

**Output**: Learning Path panel on Topic Graph tab.

---

## Step 5: Enhance Tooltips
**Prompt**: "Expand all acronyms in tooltips and add better descriptions using examples from the slides."

**What Copilot does**:
- Reviews all ~100 node tooltips
- Expands acronyms (TCP → Transmission Control Protocol)
- Adds real examples from lecture content
- Makes tooltips interactive (clickable slide links)

**Output**: Enhanced tooltips across mind map and graph.

---

## Step 6: Add Node Comment/Command Panel (💬 Comments)
**Prompt**: "Add a feature to add comments and tags to any node."

**What Copilot does**:
- Double-click any node to open command panel
- Add text comments with timestamps
- Tag nodes (⭐ important, ✅ done, 🔄 revisit, ❓ doubt)
- All saved to localStorage (per client)
- Visual badges on tagged nodes

**Output**: Comment panel with localStorage persistence.

---

## Step 7: Add Deep Dives (Tab 3 — 📚 Deep Dives)
**Prompt**: "Add a Deep Dives tab with infographic cards for key concepts."

**What Copilot does**:
- Creates card grid with concept infographics
- Each card has: SVG diagram, sections, keypoints
- Full-screen detail view with navigation (prev/next)
- Back to grid button (floating control)

**Output**: Third tab with deep dive concept cards.

### Step 7b — Deep Dive authoring quality bar

A Deep Dive is a **self-contained mini-lesson**, not a flashcard. After
upgrading 18+ courses, the patterns that consistently produce
study-grade cards:

1. **SVG is required.** Empty placeholders are a code smell. Pick from
   the diagram archetypes in `README.md` → *Authoring Cookbook* (schematic,
   swimlane, state-machine, plot, cross-section, table grid, tree,
   flowchart). Drive geometry from the `(w,h)` args + a `viewBox` so the
   card stays crisp on resize.

2. **Sections** — 5 sections, 60–150 words each, in this order:
   - **Intuition** — plain-language framing.
   - **Mechanism / Key Formula** — how it actually works.
   - **Where It Is Used & How** — the production/workflow context:
     concrete domains, the job this concept performs, what system owns it,
     what metric proves it helped, and the failure mode it changes. This
     section is required for every deep dive; it keeps the page from becoming
     abstract notes detached from real usage.
   - **Worked Example** — concrete numbers end-to-end.
   - **Pitfall + Real-World Tie-In** — the common mistake + the CVE / RFC
     / paper / production system this connects to.
   The worked-example + pitfall + tie-in trio is what separates a
   "definition" card from a "study-grade" card.

3. **Keypoints** — 4–6 items, each with at least one concrete artifact
   (a number, formula, code line, or named reference like
   "RFC 6298" / "CVE-2021-44228" / "Cormen Ch. 4").

4. **Strong references** — every deep dive needs 1–2 source anchors:
   canonical paper, official docs, respected textbook, RFC/CVE/spec, or
   model/system card. Add them as `dd.refs` or a **Strong References**
   section. Prefer primary sources over blog posts. If the card is already
   dense, references can be short; if the card is thin, include one sentence
   on why each reference is worth reading.

5. **SVG idiom** — string concatenation (not template literals), one
   `<defs><marker>` per SVG, loops via
   `Array.from({length:N}).map((_,i)=>...).join('')` for repeated
   geometry. Cap primitives at ~50–80 to keep the SVG <3 KB.

6. **Optional `mount(el)` for interactive dives** — for the rare card
   that needs a live stepper / slider / play-pause (e.g. a systolic
   array animation, a roofline knob, a sharding-mesh toy), add an
   `mount: function(el) { ... }` next to `svg`. It's called once,
   right after the full-view DOM is populated, with the `.dd-full`
   container as `el`. Use it to wire buttons, run `setInterval`
   animations, and replace SVG fragments. Keep `svg()` returning the
   static snapshot so card thumbnails stay crisp; have `mount` add a
   `class="dd-XXX-svg"` selector in `svg()` so it can locate and
   re-render the SVG. Schema is fully backward compatible — dives
   without `mount` keep working unchanged.

   ```js
   svg: function(w,h){ return '<svg class="dd-foo-svg" ...>...</svg>'; },
   mount: function(el){
     var svgEl = el.querySelector('svg.dd-foo-svg');
     var bar = document.createElement('div'); /* controls */
     svgEl.parentNode.insertBefore(bar, svgEl);
     // wire events, define render(state), call render(initial)
   }
   ```

6. **Prose density — no wall-of-text "blobs".** A section's `text` should
   never be a single 200+ char paragraph with no block-level markup. Either:

   - **Embed visuals + bullets/cards** directly in the `text` HTML (the
     preferred path — see how `study/pmpp.html` `dd-foundations` mixes an
     inline `<svg>` with a `<ul>` for the worked example), **or**
   - **Run the post-processor** to auto-restructure prose:

     ```powershell
     # idempotent; safe to re-run
     python plugins/studytool/reformat_prose.py
     # or target one file
     python plugins/studytool/reformat_prose.py study/cormen.html
     # dry-run to see what would change
     python plugins/studytool/reformat_prose.py --dry-run
     ```

   The script wraps prose in `<div style='line-height:1.65'>` and splits
   it into ~240-char `<p>` chunks at sentence boundaries. It detects
   `(1) ... (2) ... (3) ...` enumerations and promotes them to `<ol>`
   with a lead-in paragraph plus optional trailing prose. It **only**
   touches sections whose title starts with `Intuition`, `Mechanism`,
   `Worked Example`, or `Pitfall`, and **skips** any section that
   already contains `<svg|ul|ol|table|div|p|h*>` — so adding new
   structured content is always safe.

   Why this matters: long unstructured blobs under the orange section
   headings look like a stack-overflow paste, not a study card. The
   restructured version reads top-to-bottom at the same density as the
   visual + bullets path, and respects the same `line-height:1.65`
   rhythm used by manually-authored cards.

See `README.md` → *Authoring Cookbook* for the full SVG cookbook,
diagram archetype table, and schema-drift detection guide.

---

## Step 7c: Add Use Cases (Tab 4 — 🎯 Use Cases)
**Prompt**: "Add a Use Cases tab showing how the concepts are applied end-to-end."

**What Copilot does**:
- Card grid of canonical applied scenarios
- Each card opens a step-by-step walkthrough panel

**Authoring shape that works**: 4–6 steps per use case, walking
trigger → component → mechanism → outcome. Each step has a 1-line
`detail`, the responsible `component`, and a `proto` (or operation
name). A short `code` snippet (≤ 6 lines) and 1–2 `refs` (RFC, paper,
vendor doc) dramatically lift comprehension.

For language-learning topics, `proto` works as the linguistic operation
name (padaccheda, samāsa-vigraha) where networking docs name a
protocol (TCP, BGP). For chemistry/engineering, use the unit operation
(leaching, electrowinning, regen-cooling).

**Aim for 3–6 use cases per course** covering distinct scenarios — not
variations on the same one.

> ⚠️ **Legacy template gotcha**: Some older study-tool files were
> generated before the Use Cases tab existed. They have `deepDives` +
> `problems` rendering but **no** `#view-usecase` container, no
> `tabs.push({id:'usecase'...})` entry, and no use-case renderer JS.
> Simply adding a `useCases:` array to `COURSE_CONFIG` is **not enough**
> in those files — the tab still won't appear because the host page
> never wires it up. **Check first**:
> ```
> grep -l 'view-usecase' study/<topic>/index.html
> ```
> If it returns nothing, port the use-case **CSS**, **`<div id="view-usecase">`**,
> tab-push line, `switchTab` hide line, and the `showUseCase / ucGoTo /
> ucNext / ucPrev / ucAutoPlay / ucReset / showUseCaseGrid` block from
> `template.html` into the file before authoring use cases. See
> `files/patch_usecase.js` in session-state for a reference patcher.

---

## Step 7d: Add Practice Problems (Tab 5 — 🧩 Practice)
**Prompt**: "Add a Practice tab with problems grouped by week/topic."

**What Copilot does**:
- Sectioned problem list with colored chips by tag
- Section `hook:` (one-line provocation) and per-problem `star: true` (curiosity pick)
- Three optional progressive reveals per problem:
  - `hint`     → 💡 *nudge* (purple)
  - `approach` → 🔑 *how to attack it* (blue, HTML allowed: `<ul>`, `<code>`, `<strong>`)
  - `answer`   → 📐 *the result / sketch* (green, HTML allowed)
- Sticky toolbar: search, tag chips, status filter, progress bar, 🎲 Surprise me
- Per-problem state buttons (🤔/💡/❓) persisted under `<STORAGE_KEY>-probstate`

**Authoring conventions**:
- Each section covers **all five tags** (`design / derive / debug / code
  / paper`). This prevents collapse into a single mode of study.
- Every problem carries a **`hint`** — a 1-line *methodology nudge*
  (the formula skeleton, the decomposition step, the lemma in scope) —
  not a spoiler. This forces the author to externalise the trick, which
  often exposes under-specified questions.
- For starred / pivotal problems, also author `approach` (3–6 bullet
  steps) and `answer` (1–2 sentences with the key result). Both accept
  HTML — use `<code>` for numerics and `<strong>` for the punchline.
- 4–8 items per section is the sweet spot.

---

## Step 8: Add Tracker (📊 Tracker panel)
**Prompt**: "Add a tracker panel to show study progress."

**What Copilot does**:
- Reads from localStorage comment/tag data
- Shows stats: total nodes, commented, tagged by type
- Filter chips to view by tag category
- Node list with quick-open to comment panel

**Output**: Tracker panel accessible from header.

---

## Step 9: Add PDF Viewer with Scribble (📄 In-App PDF Viewer)
**Prompt**: "Add an in-app PDF viewer. Also add scribble note-taking — client-side only, don't alter original PDFs."

**What Copilot does**:
- Full-screen overlay with iframe for PDFs
- Canvas overlay for freehand drawing
- Pen colors, size slider, undo, clear, eraser
- Scribble strokes saved per PDF in localStorage
- Auto-resize canvas on window resize

**Output**: PDF viewer with annotation layer.

---

## Step 10: Add YouTube Appendix (Tab 4 — 📹 Appendix) — **ALWAYS BUILD**
**Prompt**: "Fetch all videos from this YouTube playlist and add an appendix tab: `<playlist_url>`"

> ⚠️ **MANDATORY**: If the course has a YouTube playlist URL (in `sourceLink`, `README.md`,
> or provided by the user), you **MUST** populate the `youtube.videos` array with real video
> data. An empty `videos: []` will hide the Appendix tab — this is never acceptable when a
> playlist URL is available. Use the `youtube_appendix.py` skill to extract video IDs.

**What Copilot does**:
1. **Extract videos** using the `youtube_appendix.py` skill:
   ```bash
   # Single course:
   python plugins/studytool/youtube_appendix.py <playlist_url> <output/index.html>

   # Batch (all subfolders with empty youtube config):
   python plugins/studytool/youtube_appendix.py --batch <study_folder>
   ```
   This uses `yt-dlp` to fetch playlist metadata (video IDs + titles) without downloading.

2. **If yt-dlp fails** (region-restricted, private playlist):
   - Search for an alternate public playlist for the same course
   - Try the NPTELHRD channel for NPTEL courses
   - Try MIT OCW channel for MIT courses
   - As a last resort, manually populate with known lecture titles using placeholder IDs

3. **Inject into config**: The skill replaces the empty `youtube: { videos: [], unitNames: {} }`
   block with real data grouped into units of ~10 videos each.

**Output**: Fourth tab with searchable video appendix — groups by unit, collapsible sections,
stats bar, direct YouTube links.

**Requires**: `pip install yt-dlp`

---

## Step 11: Add Quiz Tab (Tab 7 — 🎯 Quiz)
**Prompt**: "Add a quiz tab for course-review multiple-choice questions."

**What Copilot does**:
- Creates a config-driven quiz with multiple-choice questions
- Each question has: topic, question text, 4 options, correct answer (0-indexed), explanation
- Features: topic filter chips, single-card UI, prev/next navigation, progress bar, score tracking
- Actions: shuffle questions, reset answers, jump to next unanswered, view summary
- Summary shows: total/correct/wrong counts, per-topic breakdown, percentage score
- All stored in C.quiz array (omit to hide tab)

**Authoring quality — the `explain` field is where students actually learn.**
Write review-quality explanations (target ~50–120 words / 3–5 sentences), not
one-liners. Use this 4-part pattern for every question:

1. **Correct answer + core why** — one sentence stating the answer and the
   single most important reason it is right.
2. **Technical context** — the formula, mechanism, definition, theorem, RFC
   number, or paper citation that a student should retain from the question.
3. **Why a wrong option is wrong** — one sentence pointing at the trap in
   one or two distractors (common misconception, off-by-one, sign error,
   confused-with-related-concept).
4. **Memorable tie-in** — a real-world example, a common pitfall, a related
   concept worth knowing, or a pointer to deeper reading.

Avoid filler like "B is correct because B is the answer." Be concrete and
domain-specific. The quiz tab should function as a review mode, not just a
multiple-choice gate.

**Schema**:
```js
quiz: [
  {
    topic: "Unit 1",
    q: "Question text here?",
    options: ["Option A", "Option B", "Option C", "Option D"],
    answer: 1,
    explain: "Option B is correct: <core why in 1 sentence>. Technically, <formula / mechanism / definition>. Option A is the common misconception — it confuses <X> with <Y>; option D only holds when <edge case>. In practice this matters because <real-world example or pitfall>, and is covered in <reference / chapter / RFC>."
  },
  { topic: "General", q: "...", options: ["...","...","...","..."], answer: 0,
    explain: "<3–5 sentences following the same 4-part pattern>" }
]
```

**Output**: Interactive quiz tab with topic filtering, progress tracking, and
elaborate review-style explanations after each answer.

### Step 11b — Wiring & Verification (avoid the silent-quiz bugs)

The quiz module is split into two `<script>` blocks at the **end of `<body>`**.
Two recurring authoring mistakes silently disable the quiz (no tab appears,
no console error). **Always run `verify_quiz.js` after editing.**

**Required layout** — exact order matters:

```html
<!-- ============================================================
     DROP-IN QUIZ MODULE — self-bootstrapping
     Place this entire block immediately before </body>.
     Customize the JSON inside the script tag below.
============================================================ -->
<script id="quiz-data" type="application/json">
[
  { "topic": "...", "q": "...", "options": ["...","...","...","..."], "answer": 0, "explain": "..." }
]
</script>
<script>
(function() {
  const dataEl = document.getElementById('quiz-data');
  if (!dataEl) return;
  /* ... IIFE: CSS injection, render, boot() ... */
})();
</script>
</body>
```

**Pitfall #1 — Unclosed HTML comment**
If the `============================================================ -->` closer
is missing, the HTML parser treats *everything below it* (including both
`<script>` tags and all JSON) as comment text. `document.getElementById('quiz-data')`
returns `null` and the IIFE silently exits via `if (!dataEl) return;`.
**Never write the literal `<script>` opening tag inside the comment** — author
the comment with words like "the script tag below" and put the real tag after
the `-->` close.

**Pitfall #2 — IIFE before data in source order**
The IIFE script executes synchronously when the parser hits its closing
`</script>`. If `<script id="quiz-data">` comes *after* the IIFE in source
order, the data element isn't in the DOM yet and `getElementById` returns null.
**The `<script id="quiz-data">` block must come before the `<script>` IIFE
block.**

**Verifier** — run this from the repo root after authoring or editing a quiz:

```bash
node plugins/studytool/verify_quiz.js study/<course>/index.html
```

It DOM-parses the file (respecting HTML comments), **auto-detects which of the two supported architectures the file uses**, and runs the appropriate checks.

**Style A — JSON-bootstrap (default for new HTMLs):**
- `<script id="quiz-data">` is a real DOM element (not trapped in a comment)
- The JSON parses and has ≥1 question
- An IIFE script containing `document.getElementById('quiz-data')` and `function boot(` exists in the real DOM
- The data script appears before the IIFE script in source order

**Style B — inline `C.quiz` inside `COURSE_CONFIG` (e.g. pmpp):**
- `<div id="view-quiz">` exists
- `tabs.push({ id: 'quiz', ... })` registration is present
- `quiz: [ ... ]` (inside COURSE_CONFIG) or `C.quiz = [ ... ]` parses and has ≥1 question
- A render function (`renderQuiz`, `quizPool`, or `quizTopics`) references `C.quiz`

**Both styles also enforce:**
- `<!--` / `-->` counts are balanced (unclosed comments are the #1 silent killer)

Pass criteria: all style-appropriate checks green. The validator prints the detected style in its output (`Style A (JSON-bootstrap)` or `Style B (inline C.quiz)`) so you can confirm it picked the right path.

---

## Step 12: Add Source Link
**Prompt**: "Add a YouTube playlist link at the bottom right corner."

**What Copilot does**:
- Fixed-position link at bottom-right
- Styled as a subtle pill button
- Links to the course playlist/source

**Output**: Floating source link.

---

## Step 12: Mobile Responsive + Hamburger Menu
**Prompt**: "Make the website mobile friendly. Use a hamburger menu for the header."

**What Copilot does**:
- Adds responsive CSS at 768px and 480px breakpoints
- Single-column layouts, compact controls
- ☰ hamburger button toggles tab menu as vertical dropdown
- Floating controls reposition on mobile

**Output**: Fully responsive layout.

---

## Step 13: Floating Overlay Controls
**Prompt**: "Move page-specific buttons to floating overlay controls (like the health app style)."

**What Copilot does**:
- Removes sub-bar, adds `.canvas-controls` per view
- Pill-shaped buttons floating at top-right (desktop) / bottom (mobile)
- Only visible for the active tab
- Keeps Learning Path and Tracker in header

**Output**: Clean floating control layout.

---

## Step 13.5: Add Glossary (📖) + sticky Deep-Dive nav

**Prompt**: "Add the Glossary tab and sticky Deep-Dive nav."

**Invocation**:
```powershell
node plugins/studytool/patch_glossary_v1.js study/<topic>/index.html
```

**What the patcher does** (7 idempotent operations, each guarded by a marker so re-runs are no-ops):
- **(a)** Injects CSS for the Glossary view, six-layer intensified card-flash animation (uses `color-mix(in srgb, var(--cat-color) …)` with `@supports not (color-mix)` fallback), graph-node halo pulse, mindmap halo pulse, top-of-screen toast banner, tooltip glossary-footer link, and the `.dd-nav.dd-nav-top` sticky-top rule.
- **(b)** Adds `<div id="view-glossary">` (search input + category pills + responsive card grid) right after `#view-problems`.
- **(c)** Registers the `📖 Glossary` tab immediately before the `🧠 Practice` push (guarded by `if (C.glossary && C.glossary.length)`).
- **(d)** Inserts a **`glossary: [ … ]` placeholder** inside `COURSE_CONFIG` (right after `useCases: [ … ],`). This is where you author entries — see schema below.
- **(e)** Injects the JS bundle: `renderGlossary()`, `showGlossaryToast()`, `glossaryJumpToTerm`/`glossaryJumpToGraphNode`/`glossaryJumpToMindmapNode` (3-layer highlight: pan+zoom → expanding gold halo ring(s) → toast banner), tooltip monkey-patch that appends a "📖 Defined in glossary →" footer for matching graph/mindmap nodes, plus build of `window._glossaryIdByGraphNode` / `_glossaryIdByMindmapName` lookups.
- **(f)** Adds `.attr("data-id", d => d.id)` to the D3 graph-node chain so the jump helper can target nodes (skipped with reason "no graph" if the topic has no Topic Graph).
- **(g)** Moves the per-card Deep-Dive nav (`← Prev | Grid | Next →`) from the bottom of each card to a **sticky-top bar** using `class="dd-nav dd-nav-top"`. The bar stays visible while scrolling long deep dives.

**Authoring guide** (manual, per-topic — the patcher does NOT generate entries):

Open the patched `index.html`, find the markers
```js
// === BEGIN glossary v1 data placeholder ===
glossary: [
  /* Populate with topic-specific terms: { id, term, aka, category, short, long, seeAlso }.
     Categories: hardware | software | numerics | systems | performance | concepts */
],
// === END glossary v1 data placeholder ===
```
and replace the comment with 20–30 entries:
```js
{ id: "btree", term: "B-Tree", aka: ["B+ tree"], category: "systems",
  short: "Balanced multi-way search tree used for on-disk indexes.",
  long:  "Each internal node holds up to <code>m</code> children…",
  seeAlso: ["disk-io", "lsm-tree"] },
```
- **`id`** — kebab-case. Prefer ids that match Topic Graph `node.id`s so cross-linking auto-wires (the bundle scans `C.graph.nodes` and patches matching node `.tip`s with ` · 📖 in glossary`).
- **`aka`** — array of synonyms; matched case-insensitively against mindmap/graph labels too.
- **`category`** — one of `hardware | software | numerics | systems | performance | concepts` (each gets a distinct pill colour).
- **`seeAlso`** — array of other glossary `id`s; rendered as `→ <Term>` buttons on the card.

**Verification**:
```powershell
node plugins/studytool/verify_quiz.js   study/<topic>/index.html
node plugins/studytool/verify_config.js study/<topic>/index.html
node --check study/<topic>/index.html   # quick syntax sanity (will complain about HTML, but JS syntax errors are reported)
```
The patcher itself runs both validators after patching and reports a per-op summary plus a `<script>`-body syntax check.

**Idempotency**: safe to re-run. Each op is gated on a unique marker (`BEGIN glossary v1 css`, `BEGIN glossary v1 view`, `glossary v1 tab`, `BEGIN glossary v1 data placeholder`, `BEGIN glossary v1 js`, `glossary v1 data-id`, `dd-nav v1 top inserted`). Once entries are authored, re-running leaves the data untouched.

**Output**: Sixth tab `📖 Glossary` with debounced search, category pills, expandable cards, and bidirectional jumps Glossary ↔ Topic Graph ↔ Mind Map. Deep Dives gain a sticky prev/next bar.

---

## Step 14 (Optional): Add PWA Support (📱 Install & Offline)

> **Skip this step by default.** PWA generation is **opt-in** — only perform it when the user has
> explicitly asked for installable/offline support (e.g. "make it a PWA", "I want offline mode",
> "add install prompt"). Otherwise leave `manifest.json`, `sw.js`, and the `icons/` folder out of
> the output, and keep the `<link rel="manifest">` line and service-worker registration block in
> `index.html` commented out (they ship commented in `template.html`).

**Prompt (only when requested)**: "Make this installable as a PWA with offline support."

**What Copilot does when the user asks for PWA**:

### 14a — Generate a topic-specific icon

1. Create an `icons/` folder in the site root
2. Generate two PNG icons (`icon-192.png`, `icon-512.png`) that represent the course topic:
   - Use **System.Drawing** (PowerShell/.NET) or a canvas-based generator
   - Dark background (`#0d1117`) to match the site theme
   - A simple recognizable symbol for the subject (e.g., a graph icon for networking, a tree for algorithms, a molecule for chemistry)
   - A 1–2 letter abbreviation of the course overlaid in accent color (`#58a6ff`)
   - Both sizes use the same design, scaled to 192×192 and 512×512

Example PowerShell snippet for icon generation:
```powershell
Add-Type -AssemblyName System.Drawing
foreach ($size in @(192, 512)) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'HighQuality'
    $g.Clear([System.Drawing.Color]::FromArgb(13, 17, 23))  # #0d1117
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(88, 166, 255))
    # Draw a subject-specific shape (book, graph, molecule, etc.)
    # Overlay course abbreviation
    $font = New-Object System.Drawing.Font("Segoe UI", ($size * 0.22), [System.Drawing.FontStyle]::Bold)
    $sf = New-Object System.Drawing.StringFormat; $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
    $g.DrawString("CP", $font, $brush, [System.Drawing.RectangleF]::new(0,0,$size,$size), $sf)
    $g.Dispose()
    $bmp.Save("icons/icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
```

### 14b — Create `manifest.json`

Place in the site root with course-specific values:
```json
{
  "name": "<Course Full Name>",
  "short_name": "<Abbreviation>",
  "description": "<One-line course description>",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#0d1117",
  "theme_color": "#0d1117",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### 14c — Create `sw.js` (Service Worker)

Place in the site root. Caches the app shell + D3.js CDN for offline use:
```javascript
const CACHE_NAME = '<storageKey>-v1';
const ASSETS = ['./', './index.html', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png',
  'https://d3js.org/d3.v7.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(cached => {
    if (cached) return cached;
    return fetch(e.request).then(r => {
      if (r.ok && e.request.method === 'GET') {
        caches.open(CACHE_NAME).then(c => c.put(e.request, r.clone()));
      }
      return r;
    });
  }).catch(() => e.request.mode === 'navigate' ? caches.match('./index.html') : undefined));
});
```

### 14d — Wire into `index.html`

Uncomment the PWA hooks that ship pre-commented in `template.html`.

In `<head>`:
```html
<meta name="theme-color" content="#0d1117">
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/icon-192.png">
```

Before closing `</script>`:
```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
```

**Output**: Installable PWA with offline fallback. Users see "Install" prompt in browser.

---

## Step 15: Clean Up Empty Folders & Temp Files
**Prompt**: "Clean up empty folders and temporary files from the output directory."

**What Copilot does**:
- Recursively finds and removes empty directories (e.g., `lectures/`, `assignment-notes/`, `data/`, `lecture-notes/` if no content was placed in them)
- Removes any temporary/intermediate files created during generation (e.g., `_config_part1.tmp`, `extracted_syllabus.txt`)
- Only folders that the generation step created and left empty are removed — user-provided files are never deleted

**PowerShell one-liner**:
```powershell
Get-ChildItem -Path "<target>" -Directory -Recurse | Where-Object { (Get-ChildItem $_.FullName -Force).Count -eq 0 } | Remove-Item -Force
```

**Output**: Clean output directory with no empty placeholder folders or temp artifacts.

---

## Step 16: Git Init & Organize for GitHub Pages
**Prompt**: "Create a fresh git repo. Rename the main file to index.html."

**What Copilot does**:
- `git init`, add all files, initial commit
- Rename to `index.html` for GitHub Pages compatibility
- Organize folder structure (data files separate from app)

**Output**: Git repo ready for GitHub Pages deployment.

---

## Deployment
Add authour to push changes toGitHub Pages.

---

## Features Summary

| Feature | Tab/Location | Data Source | Storage |
|---------|-------------|-------------|---------|
| Mind Map | Tab 1 | Course topics tree | — |
| Topic Graph | Tab 2 | Nodes + edges | — |
| Learning Path | Tab 2 panel | Step sequence | — |
| Deep Dives | Tab 3 | Concept cards | — |
| Appendix | Tab 4 | YouTube playlist | — |
| Practice Problems | Tab 5 | Problem array | — |
| Quiz | Tab 6 | Question array | — |
| Comments/Tags | Any node | User input | localStorage |
| Tracker | Header button | Comment/tag data | localStorage |
| PDF Viewer | Overlay | Lecture PDFs | — |
| Scribble Notes | PDF overlay | User drawings | localStorage |
| Source Link | Bottom-right | Playlist URL | — |
| PWA Install (optional) | Browser prompt | manifest.json | Cache API |
| Offline Mode (optional) | Service worker | Cached shell | Cache API |
| Responsive | Global | Hamburger menu, single-column | — |
| Floating Controls | Per-tab | Context-specific pill buttons | — |

All features are client-side. No server needed. Single HTML file (+ PWA assets only when the user asks).
