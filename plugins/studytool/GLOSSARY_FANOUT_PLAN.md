# Glossary + Sticky-Top Deep-Dive Nav — Fleet Rollout Plan

This plan captures how the **📖 Glossary** feature and the **sticky-top Deep-Dive
per-card nav** (both prototyped in `study/tpu/index.html`) are packaged into the
`studytool` plugin and rolled out across every other template-conformant study
HTML in this workspace.

## Scope

**Reference (already done):** `study/tpu/index.html` — 52 entries, 3-layer
cross-tab jump highlight, intensified see-also flash, sticky top dd-nav.

**In-scope HTMLs (19 candidates under `study/`):**
algo, battery-storage, biogas-plant, compilers, differential-geometry,
gold-extraction, maths, mit-distributed-systems, networking, nuclear-physics,
pmpp, programming-languages, radar-engineering, rocket-engineering,
sanskrit-learning, satellite-imaging, security, security-pg, security-ug.

**Out of scope:** `tpu` (already done), `arithmetic` (user-excluded).

**Bespoke / risk:** `networking` historically deviates from the template —
patcher anchors may not match. Its agent must run the patcher and report
any errored anchors rather than mutating the file half-way.

## Phase A — Package into the plugin

Outputs (under `plugins/studytool/`):

1. **`patch_glossary_v1.js`** — idempotent Node patcher. Single CLI:
   `node patch_glossary_v1.js <path-to-index.html>`.
   Applies 7 guard-marked injections (CSS, view div, tab registration,
   `glossary: []` placeholder, JS bundle, `data-id` on graph nodes, dd-nav top
   move). Creates `.bak-glossary-v1` on first run; subsequent runs are no-ops.
   Runs `verify_quiz.js`, `verify_config.js`, and `node --check` on every
   inline script body, exits non-zero on any failure.

2. **`PLAYBOOK.md`** — new step documenting:
   - What the feature provides
   - How to invoke the patcher
   - How to author topic-specific entries (schema, categories, expected count
     20–30, cross-ref conventions)
   - Verification recipe
   - Idempotency note

3. **`template.html`** — no automatic embed for now (leave the feature opt-in
   via patcher) to keep new-tool generation lightweight. Revisit after fleet
   rollout is stable.

4. **Smoke test** — run patcher against `algo`, verify all 7 patches apply +
   validators pass + idempotent on second run, then **revert** algo from
   backup so the fan-out agent for algo starts clean.

## Phase B — Fan-out (1 agent per HTML)

For each of the 20 in-scope HTMLs, a `general-purpose` background agent is
spawned with an identical contract:

1. **Apply patcher**: `node plugins/studytool/patch_glossary_v1.js <path>`.
   - Report which of the 7 patches applied / skipped / errored.
   - If `arithmetic` or `networking`: dry-run first, abort if any patch errors,
     report to caller. Do not partial-apply.

2. **Curate `glossary: []`** entries from that topic's existing `deepDives` +
   `useCases`:
   - Target 20–30 entries (minimum 15).
   - Schema: `{ id, term, aka, category, short, long, seeAlso }` where
     `category ∈ {hardware, software, numerics, systems, performance, concepts}`
     (categories may not all apply to every topic — that's fine, just use the
     ones that do).
   - `seeAlso` should reference other glossary `id`s in the same file.
   - Where the topic has a Topic Graph (`COURSE_CONFIG.graph.nodes`) or
     Mind Map (`COURSE_CONFIG.mindmap`), prefer term ids that match node
     ids/labels so the cross-tab jump pills auto-wire. Don't force matches —
     the jump helpers already no-op gracefully.

3. **Verify**:
   - `node verify_quiz.js <path>` → PASS
   - `node verify_config.js <path>` → PASS
   - `node --check` on every inline `<script>` body (after stripping HTML
     comments) → 0 failures
   - File size grew by ~40–60 KB
   - Quick visual sanity via grep: tab registered, view div present,
     `glossary:` non-empty.

4. **Report** to caller:
   - Entry count
   - Category distribution
   - Cross-link coverage (entries linked to graph / mindmap nodes)
   - Validator results

Results land in SQL `verify_results` (one row per topic).

## Risks / Known issues with this approach

1. **Style drift across topics.** Independent agents will curate slightly
   different definition styles. Mitigation: the prompt pins a schema with
   example phrasing; output is still 20× more consistent than ad-hoc.

2. **Bespoke files** (`arithmetic`, `networking`) may break the patcher's
   anchor regexes. Mitigation: dry-run + abort policy in the agent prompt.

3. **Topics without Topic Graph / Mind Map** (likely: maths,
   sanskrit-learning, differential-geometry) will produce a glossary with no
   cross-tab jump pills — the feature degrades to a flat dictionary. That's
   acceptable; flagged in the report.

4. **18+ parallel general-purpose agents** is a notable cost spike, and
   workspace files are shared (each agent touches a different HTML, so no
   write contention — but the smoke-test backup for algo must be cleaned up
   before the algo agent runs).

5. **No git in this workspace** — backups live as `.bak-glossary-v1` next to
   each file. If an agent corrupts a file, recovery is manual.

6. **Patcher embeds verbatim TPU CSS/JS.** Future tweaks to TPU's glossary
   diverge from the patcher unless the patcher is re-cut. That's acceptable
   for v1; a regen-from-TPU script can come later if needed.

7. **Agent prompt token budget**: each agent's prompt is ~3–4 KB; 20 agents
   × Sonnet is meaningful. Acceptable for a one-shot fleet rollout.

8. **Verification cannot prove the entries are *correct*** — only that they
   parse and the file still validates. Quality of definitions is the agent's
   responsibility; spot-check after rollout.

## Wave plan

- **Wave 0**: Phase A (patcher + PLAYBOOK + algo smoke test).
- **Wave 1**: 5 well-formed topics (algo, compilers, programming-languages,
  pmpp, mit-distributed-systems). Surface anchor mismatches early.
- **Wave 2**: 13 remaining straightforward topics.
- **Wave 3**: 2 bespoke topics (`arithmetic`, `networking`) — dry-run gated.

Alternative: one big wave of 20. Either is fine; the wave plan exists only to
catch patcher bugs before they're 20× replicated.
