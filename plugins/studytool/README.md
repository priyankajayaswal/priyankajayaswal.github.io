# Study Tool Generator — Copilot Plugin

Generates an interactive, self-contained study website from course lecture materials and an optional YouTube playlist.

**Live example**: [CS 144 Computer Networking](https://priyankajayaswal.github.io/networking/)

---

## Files

| File | Purpose |
|------|---------|
| `template.html` | Generic HTML template — all rendering logic, sample data for testing |
| `PLAYBOOK.md` | Step-by-step prompt guide to build a site from scratch |
| `README.md` | This file — config schema and feature reference |
| `verify_quiz.js` | **Guard**: DOM-parses a site and verifies the quiz module is wired correctly (catches the unclosed-comment and IIFE-ordering bugs). Run after authoring/editing any quiz. |
| `verify_config.js` | **Guard**: extracts and `vm`-evaluates the `COURSE_CONFIG` block; checks Deep Dive shape (svg present and non-empty, sections/keypoints present, no legacy `{heading,body}` / `markdown:` / `cards:[{term,detail}]` shapes), Use Case steps, and Practice problem hint coverage. Run alongside `verify_quiz.js`. |
| `youtube_appendix.py` | **Skill**: Extract YouTube playlist → inject video appendix into index.html |
| `hub_generator.py` | **Skill**: Scan folders for study tools → generate card-based hub index.html |
| `manifest.json` | PWA manifest template — **only copied when the user asks for PWA support** |
| `sw.js` | Service worker template — **only copied when the user asks for PWA support** |
| `icons/` | PWA icons (192×192 and 512×512) — **only copied when the user asks for PWA support** |
| `lectures/` | Sample PDFs for testing PDF viewer + scribble |
| `lecture-notes/` | Sample lecture notes PDFs |

---

## How It Works

1. Prepare a folder with course materials (lecture PDFs, notes, etc.)
2. Ask Copilot to generate a study tool using `PLAYBOOK.md`
3. Copilot reads the folder, analyzes content, and builds a `COURSE_CONFIG` object
4. Copilot injects the config into `template.html` and saves the output as `index.html`
5. **(Optional, opt-in)** If — and only if — the user explicitly asks for PWA / install / offline support, Copilot also copies `manifest.json`, `sw.js`, and `icons/` into the output folder (updating name/description) and uncomments the PWA hooks in `index.html`. By default the generated site is a pure single-file static page with no service worker.
6. Open `index.html` in a browser — no build step, no server needed

---

## COURSE_CONFIG Schema

```javascript
const COURSE_CONFIG = {
  schemaVersion: 1,

  course: {
    code: "CS 101",              // Short code shown in toolbar
    title: "Sample Course",      // Full course title
    term: "Fall 2025"            // Academic term
  },

  storageKey: "cs101",           // localStorage prefix (keep short, unique)

  sourceLink: {                  // Bottom-right floating link (omit to hide)
    url: "https://youtube.com/playlist?list=...",
    label: "▶ Course Playlist"
  },

  // ── Reference PDF toolbar button (omit to hide) ──
  //
  // RULE: Only configure `pdfReference` when the course has exactly ONE
  // reference document under `references/<course>/`. If there are multiple
  // reference PDFs (textbook + lecture notes + cheat sheet, etc.), do NOT
  // set `pdfReference` — link each one individually from the mindmap /
  // graph / deep-dive `slides` arrays instead, so the single toolbar
  // button doesn't arbitrarily privilege one of them.
  //
  // When set, a 📕 PDF button appears in the header (before the Tracker
  // button) and opens the PDF in the inline viewer with scribble overlay.
  pdfReference: {
    path: "references/cs101/textbook.pdf",
    label: "📕 CS 101 — Textbook Title"
  },

  depthColors: ["#58a6ff", "#f778ba", "#7ee787", "#ffa657", "#d2a8ff", "#79c0ff"],

  // ── Tab 1: Mind Map (omit to hide) ──
  mindmap: {
    name: "Root Node",
    tooltip: "Root description",
    children: [
      {
        name: "Week 1\nTopic Name",
        tooltip: "Description",
        slides: [{ label: "📄 Slides", path: "lectures/week1.pdf" }],
        children: [
          { name: "Sub-topic", tooltip: "Details" },
          { name: "Lab 1", tooltip: "Lab description", _lab: true }
        ]
      }
    ]
  },

  // ── Tab 2: Topic Graph (omit to hide) ──
  graph: {
    categories: { core: "#58a6ff", applied: "#f778ba" },
    edgeColors: { depends: "#58a6ff", implements: "#f778ba", enables: "#7ee787", related: "#ffa657" },
    nodes: [
      { id: "node1", label: "Node 1", cat: "core", tip: "Description",
        slides: [{ label: "📄 Week 1", path: "lectures/week1.pdf" }] }
    ],
    edges: [
      { source: "node1", target: "node2", type: "depends", label: "builds on" }
    ]
  },

  // ── Learning Path (omit to hide button) ──
  learningPath: [
    { title: "Step Title", desc: "What to learn", nodes: ["node1", "node2"], week: "Week 1" }
  ],

  // ── Tab 3: Deep Dives (omit or [] to hide) ──
  //
  // QUALITY BAR — a Deep Dive card is a *self-contained* mini-lesson, not a
  // flashcard. After 18+ courses the patterns that consistently produced
  // study-grade cards are:
  //
  //   • SVG REQUIRED. Empty/placeholder SVGs make the card feel like a stub.
  //     Pick from the diagram archetypes below (schematic, swimlane,
  //     state-machine, flowchart, plot/curve, cross-section, table grid,
  //     tree). Drive geometry from the (w,h) args + viewBox so the card
  //     stays crisp when the user resizes.
  //
  //   • SECTIONS — aim for 4 sections of 60–150 words each, structured as:
  //         (1) Intuition / overview
  //         (2) Mechanism or key formula
  //         (3) Worked example with concrete numbers
  //         (4) Pitfall + real-world tie-in (CVE, RFC, paper, system)
  //     The worked-example + pitfall + tie-in trio is what separates a
  //     "definition" card from a "study-grade" card.
  //
  //   • KEYPOINTS — 4–6 items, each carrying at least one concrete number,
  //     formula, code line, or named reference. "Sequencing matters" is
  //     weak; "MSS = 1460 B; sender uses Nagle when unACKed < MSS" is
  //     strong. At least one keypoint should reference a real artifact
  //     (CVE-XXXX, RFC NNNN, Paper et al. YYYY).
  //
  // The schema is permissive (sections/keypoints all optional), so the
  // quality bar lives here in the docs rather than in the renderer.
  deepDives: [
    {
      id: "unique-id", num: "Concept 1 of N", title: "Title", desc: "Short description",
      color: "#58a6ff", icon: "🔬",
      // SVG idiom: string concatenation (not template literals — they break
      // grep + escape badly when nested in the larger HTML). Use viewBox
      // driven by (w,h). One <defs><marker> block per SVG; marker IDs are
      // scoped to the inline <svg> so duplicate IDs across cards are fine.
      svg: function(w, h) {
        return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117">'
          + '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#58a6ff"/></marker></defs>'
          + '/* topic-specific geometry here */'
          + '</svg>';
      },
      sections: [
        { title: "Intuition",       text: "Plain-language framing of the concept." },
        { title: "Mechanism",       text: "How it actually works, step by step." },
        { title: "Where It Is Used & How", text: "Where this shows up in production/research, how it is wired into the workflow, what metric proves it helped, and what failure mode it changes." },
        { title: "Worked Example",  text: "Concrete numbers end-to-end (e.g., 'For p=23, g=5, a=6 → A=8...')." },
        { title: "Key Formula",     formula: "y = mx + b" },
        { title: "Pitfall & Tie-In",text: "The common mistake students make + the real-world system or paper this connects to." }
      ],
      keypoints: [
        { title: "Quantified fact", text: "Carries a number, threshold, or rule of thumb." },
        { title: "Formula handle",  text: "T(n) = 2T(n/2) + O(n) → O(n log n)" },
        { title: "Pitfall flag",    text: "Off-by-one / nonce-reuse / sign-error to avoid." },
        { title: "Reference",       text: "RFC 6298 / CVE-2021-44228 / Cormen Ch. 4." }
      ],
      refs: [
        { label: "Canonical paper / official docs", url: "https://example.com", note: "Why this is the best source anchor." },
        { label: "Implementation or textbook reference", url: "https://example.com", note: "What to read here after the card." }
      ]
    }
  ],

  // ── Tab 4: Use Cases (omit or [] to hide) ──
  //
  // SHAPE that worked across courses: 4–6 steps that walk a real scenario
  // from trigger → component → mechanism → outcome. Each step gets a
  // 1-line `detail`, the responsible `component`, and the `proto` (or
  // operation name). A short `code` snippet (≤6 lines) and 1–2 `refs`
  // dramatically lift comprehension; both are optional but encouraged.
  useCases: [
    {
      id: "unique-id", title: "Use Case Title",
      desc: "Short description of the scenario.",
      icon: "🔬", color: "#58a6ff",
      steps: [
        { title: "Step Title", component: "Component Name", detail: "Detailed explanation.", proto: "Protocol / Tech",
          code: "optional CLI/code snippet (≤6 lines)",
          refs: [{ label: "RFC 793 — TCP", url: "https://tools.ietf.org/html/rfc793" }]
        }
      ]
    }
  ],

  // ── Tab 5: YouTube Appendix (**ALWAYS populate if playlist URL exists**) ──
  // Use youtube_appendix.py to extract real video IDs from the playlist.
  // An empty videos:[] hides the tab — NEVER leave empty when a playlist is available.
  youtube: {
    videos: [
      { unit: 1, id: "videoId", topic: "Video Title" }
    ],
    unitNames: { 1: "Unit 1 Name" }
  },

  // ── Tab 6: Practice Problems (Problem-First learning; omit or [] to hide) ──
  // Each "section" groups problems under a week/module heading. Each problem
  // has a `tag` that colors its chip: design | derive | debug | code | paper.
  //
  // CONVENTION (strongly recommended): every problem carries a `hint`. The
  // hint is a 1-line *methodology nudge* (which formula to apply, which
  // decomposition to try, which lemma is in scope) — not a spoiler. This
  // turns the tab from a wall of questions into a guided study set, and
  // forces the author to externalise the trick (which usually exposes
  // questions that are actually under-specified).
  //
  // SECTION TARGET: aim for 4–8 items covering *all five tags* per section.
  // The mix prevents the section from collapsing into one mode of study
  // (e.g., all-derive or all-code).
  problems: [
    {
      week: "Week 1", title: "Section Title",
      items: [
        { tag: "design", text: "Design X that handles Y. What are the tradeoffs?", hint: "Think about Z." },
        { tag: "derive", text: "Prove that ...",                                   hint: "Start from the definition; integrate by parts." },
        { tag: "debug",  text: "Given this failure mode, diagnose in 3 steps.",    hint: "Bisect the timeline; check the invariant at each boundary." },
        { tag: "code",   text: "Implement the function in 20 lines or less.",      hint: "Two pointers + a hashmap." },
        { tag: "paper",  text: "Read paper P and summarise the key insight.",      hint: "Focus on Section 3 and Figure 4." }
      ]
    }
  ],

  // ── Tab 7: Quiz (Knowledge review; omit or [] to hide) ──
  // Config-driven multiple-choice quiz. Each question: topic (for filtering),
  // question text, 4 options, 0-indexed answer, and an *elaborate* explanation.
  //
  // EXPLAIN STYLE — write review-quality explanations, NOT one-liners.
  // The quiz is a study tool, not just a gate; the explain field is where most
  // of the learning happens. Aim for ~50–120 words / 3–5 sentences:
  //   1. State the correct answer and the core reason it is right.
  //   2. Add technical context — formula, mechanism, definition, RFC/paper ref.
  //   3. Briefly note why one or two of the wrong options are wrong.
  //   4. Close with a memorable tie-in (real-world example, common pitfall,
  //      related concept worth knowing for review).
  // Avoid filler ("This is correct because B is right"); be specific and concrete.
  quiz: [
    { topic: "Unit 1",
      q: "What is the core concept?",
      options: ["A", "B", "C", "D"],
      answer: 1,
      explain: "B is correct: it captures the principle that <core mechanism>. Formally, <formula or definition with key terms>. Option A confuses it with <related-but-different concept>, and option C describes a special case that only holds when <constraint>. In practice this shows up whenever <real-world example>, which is why texts like <reference> emphasise it as the foundational invariant." },
    { topic: "Unit 1", q: "...", options: ["...","...","...","..."], answer: 0, explain: "<3–5 sentences following the same pattern>" },
    { topic: "General", q: "...", options: ["...","...","...","..."], answer: 2, explain: "<3–5 sentences following the same pattern>" }
  ]
};
```

---

## Feature Toggles

Tabs auto-hide when their config data is missing:

| Config field | Tab/Feature hidden if… |
|---|---|
| `mindmap` | falsy / omitted |
| `graph.nodes` | empty or omitted |
| `deepDives` | empty or omitted |
| `useCases` | empty or omitted |
| `youtube.videos` | empty or omitted |
| `problems` | empty or omitted |
| `quiz` | empty or omitted |
| `learningPath` | empty — hides Learning Path button |
| `deepDives` | empty array or omitted |
| `useCases` | empty array or omitted |
| `youtube.videos` | empty array or omitted |
| `problems` | empty array or omitted |
| `sourceLink` | missing — hides bottom-right link |

The first visible tab is auto-selected on load.

---

## Features

| Feature | Location | Interaction | Storage |
|---------|----------|-------------|---------|
| 📐 Mind Map | Tab 1 | Click to expand/collapse, hover for tooltips, click slides to open PDF | — |
| 🔗 Topic Graph | Tab 2 | Drag nodes, click to highlight connections, legend filters by category/edge type | — |
| 🧭 Learning Path | Tab 2 sidebar | Click steps to highlight graph nodes, auto-play walks through sequence, green progress | — |
| 📚 Deep Dives | Tab 3 | Card grid → full-page detail with SVG diagrams, formulas, prev/next navigation | — |
| 📹 Video Appendix | Tab 4 | Searchable table, collapsible units, stats bar, links to YouTube | — |
| 💬 Comments/Tags | Double-click any node | `/done` `/todo` `/confused` `/important` `/tag` `/color` `/rename` `/clear` `/reset` | localStorage |
| 📊 Tracker | Header button | Stats dashboard, filter chips by tag type, click to open node's comment panel | localStorage |
| 📄 PDF Viewer | Click any slide link | Full-screen overlay with iframe, open in new tab button | — |
| 📕 Reference PDF | Header button (when `pdfReference` set; **only with single ref doc**) | Opens the course's single reference textbook in the inline viewer | — |
| ✏️ Scribble Notes | Inside PDF viewer | Freehand drawing, 5 pen colors, size slider, undo, clear, per-PDF persistence | localStorage |
| 🔗 Source Link | Bottom-right | Floating pill link to course playlist/source | — |
| 📱 PWA Install (optional) | Browser prompt | Installable app via manifest.json, custom topic icon — **opt-in, only when user asks** | Cache API |
| 🔌 Offline Mode (optional) | Service worker | Cache-first strategy, offline navigation fallback — **opt-in, only when user asks** | Cache API |
| 📱 Responsive | Global | Hamburger menu at ≤768px, single-column layouts, repositioned controls | — |
| 🎛️ Floating Controls | Per-tab | Context-specific pill buttons (expand/collapse, reset, toggle labels, back) | — |

All features are **client-side only**. No server, no database. Single HTML file by default; PWA assets only when the user explicitly asks for installable/offline support.

---

## Skills (Automation Scripts)

### `youtube_appendix.py` — YouTube Playlist Extraction

Extracts video IDs and titles from a YouTube playlist and injects them into a study tool `index.html`.

**Requires**: `pip install yt-dlp`

**Usage**:
```bash
# Single course — provide playlist URL and target index.html
python youtube_appendix.py "https://www.youtube.com/playlist?list=PLxxx" path/to/index.html

# Batch mode — process all subfolders with empty youtube config
# Automatically finds playlist URLs from sourceLink in index.html or README.md
python youtube_appendix.py --batch path/to/study/folder
```

**What it does**:
1. Calls `yt-dlp --flat-playlist -J` to get video metadata (no downloads)
2. Groups videos into units of ~10 for the collapsible appendix UI
3. Replaces the empty `youtube: { videos: [], unitNames: {} }` block in index.html
4. If the youtube block is already populated, it skips that file

**Troubleshooting**:
- If `yt-dlp` returns no entries → playlist may be private, deleted, or region-restricted
- Try alternate playlist URLs (e.g., NPTELHRD channel for NPTEL courses)
- For MIT OCW courses, search `MIT OpenCourseWare` YouTube channel

> ⚠️ **Rule**: When generating a study tool site, if a YouTube playlist URL is available
> (in sourceLink, README.md, or user-provided), you **MUST** run this skill to populate
> the appendix. Never leave `videos: []` when a playlist exists.

### `hub_generator.py` — Hub Page Generator

Scans a root directory for study tool `index.html` files and generates a card-based landing page.

**Usage**:
```bash
# Generate hub for current directory
python hub_generator.py

# Generate hub for a specific directory
python hub_generator.py C:\src

# Watch mode — auto-rebuild on changes
python hub_generator.py C:\src --watch
```

**What it does**:
1. Scans all immediate subdirectories for `index.html` files
2. Extracts metadata (title, description, type) from each file
3. Generates a responsive card grid with accent colors and icons
4. Outputs `index.html` in the root directory

**Customization**:
- `ICONS` dict maps folder name keywords to emoji icons
- `ACCENTS` array cycles through card border/tag colors
- `SKIP` set excludes folders (`.git`, `node_modules`, `plugins`, `__pycache__`)

---

## Output Folder Structure

```
my-course/
├── index.html              ← generated from template
├── manifest.json           ← PWA manifest (only when user asks for PWA)
├── sw.js                   ← service worker (only when user asks for PWA)
├── icons/                  ← only when user asks for PWA
│   ├── icon-192.png        ← PWA icon (topic-specific)
│   └── icon-512.png
├── lectures/               ← lecture slide PDFs
│   ├── week-1-intro.pdf
│   └── week-2-topic.pdf
├── lecture-notes/           ← handwritten/typed notes
│   └── week-1-notes.pdf
└── assignment-notes/        ← optional
    └── lab-1.pdf
```

---

## Authoring Cookbook — Deep Dives, Use Cases, Practice

Distilled from upgrading 18+ courses. Apply when authoring a new course or
auditing an existing one.

### 1. Deep Dive Quality Bar

A Deep Dive is a **self-contained mini-lesson**, not a flashcard. The card
must let a learner grasp the concept without leaving it.

| Field        | Target                                                                 |
|--------------|------------------------------------------------------------------------|
| `svg`        | **Required**. Topic-meaningful diagram, not a "Diagram Placeholder" rect. |
| `sections`   | 4 sections, 60–150 words each                                          |
| `keypoints`  | 4–6, each carrying a number / formula / code line / named reference    |

**Visual richness floor — read this before authoring or "enhancing":**

- **Every Deep Dive must end up with ≥ 1 meaningful inline SVG.** If a
  topic has multiple facets (architecture + dataflow + tradeoff), use 2–3
  SVGs of different archetypes (see §2). Prose-heavy dives that ship with
  one rectangle-and-arrows diagram are the #1 quality regression.
- **Every Use Case must end up with ≥ 1 SVG flowchart, sequence diagram,
  or pipeline.** Plain bullet-list use cases are not acceptable.
- **Enhancement passes must be additive.** Earlier waves on `xla`,
  `vllm`, `cuda-graphs` over-compacted prose 25–45% trying to "make it
  visual" — every one had to be rebuilt. Rule: a visual-enrichment pass
  **must increase the page size**, never shrink it. Prose stays; visuals
  are added alongside, not in place of.
- **Diversify diagram archetypes across a page.** Aim to cover ≥ 4 of the
  archetypes in §2 across the 12–15 dives, not the same flowchart 12
  times. Force-mix: at least one comparison chart, one timeline, one
  architecture stack, one decision tree, one sequence diagram, one
  before/after fusion or transformation view.
- **Charts must encode real numbers.** Bar/line/scatter charts with
  fabricated y-values are visual noise — pull MFU%, latency µs,
  parameter counts, etc. from the model card / paper / docs.
- **Topic-correct, not decorative.** A pretty SVG of unrelated geometry
  is worse than no SVG. Each diagram should map 1:1 to a sentence in the
  prose ("see the lowering pipeline below").

**Recommended section order** — *Intuition → Mechanism → Where It Is Used
& How → Worked Example → Pitfall + Tie-In*:

1. **Intuition** — plain-language framing. Why does this exist?
2. **Mechanism** or **Key Formula** — how it actually works, with the
   defining equation if one exists.
3. **Where It Is Used & How** — concrete domains and workflows where the
   concept appears, how it is wired into a real system, which owner/metric
   cares, and what failure mode it changes. This is required for every
   deep dive so the card teaches practical transfer, not only definitions.
4. **Worked Example** — concrete numbers end-to-end. The single most
   important section. e.g., *"Sentinel-2 pixel: NIR=0.42, Red=0.18 →
   NDVI=(0.42−0.18)/(0.42+0.18)=0.40 → moderate vegetation."*
5. **Pitfall + Real-World Tie-In** — the common mistake (off-by-one,
   nonce-reuse, sign-error, base-rate fallacy) and where the concept
   shows up in production (CVE-NNNN, RFC NNNN, paper, real system).

**Keypoint convention**: every keypoint should carry **at least one
concrete artifact**: a number, a formula, a code line, or a real-world
reference. "Sequencing matters" is weak; "RFC 6298: RTO = SRTT + 4·RTTVAR,
floor 1 s, exponential backoff to 60 s" is strong.

**Reference convention**: every deep dive needs **1–2 strong references**.
Prefer a canonical paper, official docs, standard textbook, RFC/CVE/spec,
or model/system card. Add them as `refs: [{ label, url, note }]` or as a
short **Strong References** section. Avoid generic search links and weak
blog summaries unless the blog is the primary project documentation.

### 2. SVG Cookbook

The SVG idiom that survived ~150 cards across 19 courses:

```js
svg: function(w, h) {
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="background:#0d1117">'
    + '<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
    + '<path d="M0,0 L10,5 L0,10 z" fill="#58a6ff"/></marker></defs>'
    /* topic-specific geometry */
    + '</svg>';
}
```

Conventions that scaled well:
- **String concatenation, not template literals.** Template literals break
  in surprising ways when nested in the larger HTML and grep less well.
- **Drive geometry from `(w, h)`.** Use `viewBox="0 0 w h"` so cards stay
  crisp on mobile.
- **One `<defs>` per SVG.** Marker IDs are scoped to the inline `<svg>`,
  so duplicate IDs across cards are safe — but keep them short (`ar`,
  `arRed`) and prefix per-card if you reuse the same colors with different
  meanings.
- **Loop arrays for repetition.** For chirps, polytope vertices, antenna
  elements, sample paths, varnamala cells, fission generations — build
  the SVG with `Array.from({length:N}).map((_,i)=>...).join('')` to keep
  the function under 80 lines.
- **Cap geometric primitives at ~50–80.** Above that, the card slows the
  Deep Dive grid and the SVG string passes 3 KB.

**Diagram archetypes** that produced the highest-signal cards:

| Archetype                | Examples                                                  |
|--------------------------|-----------------------------------------------------------|
| Schematic / block diagram| Engine cycle, BMS block, T/R radar, reactor vessel        |
| Swimlane / sequence      | TCP handshake, TLS, Schnorr Σ-protocol, OAuth flow        |
| State machine / timeline | Raft, TCP FSM, Frenet frame, decay chain                  |
| Cross-section            | Digester, nozzle, fuel cell, satellite scanner geometry   |
| Plot / curve             | AIMD sawtooth, BE/A curve, NDVI saturation, Mach contours |
| Tree / hierarchy         | AST, samasa decomposition, fission tree, Venn nesting     |
| Table grid / matrix      | Vibhakti table, access-control matrix, varnamala, EM bands|
| Flowchart                | CIP cascade, comminution circuit, optimization passes     |

### 3. Use Case Structure

Pattern that works across topics:

- **4–6 steps**, walking trigger → component → mechanism → outcome.
- Each step: 1-line `detail`, the responsible `component`, the `proto`
  (or operation/principle name).
- **Optional but high-impact**: a `code` snippet ≤ 6 lines (CLI, pseudo-Python,
  config) and 1–2 `refs` (RFC / paper / vendor doc).
- **Required visual**: every use case must end with an inline SVG —
  pipeline diagram, sequence chart, request lifecycle, or system
  topology. A bullet list of steps without a visual fails the bar.
- Prefer **end-to-end flow over component close-up**: the use case visual
  should show the *whole journey* (user → component A → component B →
  result), so it complements (not duplicates) the per-component diagrams
  in Deep Dives.

For language-learning topics, `proto` works well as the linguistic
operation name (padaccheda, samāsa-vigraha) where networking docs name a
protocol (TCP, BGP).

### 4. Practice Problem Convention

- Every section covers **all five tags** (design / derive / debug / code /
  paper). The mix prevents collapse into one mode of study.
- Every problem carries a **`hint`** — a 1-line *methodology nudge* (the
  formula skeleton, the decomposition step, the lemma in scope), not a
  spoiler.
- 4–8 items per section is the sweet spot.

### 5. Schema Drift & Legacy Detection

The project's history left several legacy shapes in the wild. The
generator and verifier should treat these as red flags to migrate:

| Legacy shape                                   | Symptom                              | Migration                                |
|------------------------------------------------|--------------------------------------|------------------------------------------|
| `cards: [{term, detail}]` on a Deep Dive       | Card body renders as flat list       | Convert to `sections`/`keypoints`/`svg`  |
| `{heading, body}` instead of `{title, text}`   | Section text silently disappears     | Rename keys                              |
| `{title, icon, markdown}` Deep Dive stub       | Card renders empty (no `svg`/`sections`) | Replace with full schema                 |
| `const quizQuestions = [...]` inline           | `verify_quiz.js` reports all-fail    | Migrate to `<script id="quiz-data">` JSON|
| `window.PROBLEMS_DATA` global                  | Edits to `COURSE_CONFIG.problems` ignored | Remove the global; renderer uses config |
| `const C = {...}` directly                     | Two name conventions; grep ambiguity | Standardise on `COURSE_CONFIG`           |
| `SAMPLE_CONFIG` left after generation          | Two `deepDives:` matches in grep     | Delete sample block once real config is in |

**Footgun**: the `num: "K of N"` field is hand-numbered. Adding a card
forces an update of every card's `num`. Treat it as a write-once field
and consider making the renderer auto-derive from array index in a
future schema bump.

### 6. Verification Checklist

Run after authoring or editing a course:

```bash
# 1. Quiz module wiring
node plugins/studytool/verify_quiz.js study/<course>/index.html

# 2. COURSE_CONFIG parses (catches trailing-comma + brace issues
#    that the quiz verifier alone misses)
node plugins/studytool/verify_config.js study/<course>/index.html
```

`verify_config.js` extracts the `COURSE_CONFIG` block, evaluates it
with `vm`, and confirms each `deepDives[i].svg(600,300)` returns a
non-empty `<svg>` string.

