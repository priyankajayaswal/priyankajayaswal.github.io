"""
reformat_prose.py — studytool plugin post-processor

Converts long prose "blob" text inside deep-dive sections into structured HTML
(paragraphs, ordered lists when an enumeration is detected) without altering
sections that already contain block-level markup (svg, ul, ol, table, div, p, h*).

The convention this enforces (see PLAYBOOK.md "Prose density rules"):
  - Section text must NOT be a single 200+ char paragraph blob.
  - Either embed an SVG + bullets/cards, OR let this script split the prose
    into ~240-char <p> chunks wrapped in a line-height:1.65 container.
  - Detected "(1) ... (2) ... (3) ..." enumerations become <ol> with a lead-in
    paragraph and optional trailing prose, keeping the orange section heading
    visually anchored to the structure that follows.

Targets section titles whose first word matches one of TITLE_PREFIXES
(Intuition, Mechanism, Worked Example, Pitfall) — the four "prose-heavy"
slots in the deep-dive template. Other titles (References, Visual Gallery,
Per-Algorithm Details, code labs, etc.) are intentionally left alone.

Idempotent: re-running on already-structured sections is a no-op.

USAGE
-----
  # default: rewrite study/ml.html and study/pmpp.html in place
  python plugins/studytool/reformat_prose.py

  # dry-run, no writes
  python plugins/studytool/reformat_prose.py --dry-run

  # specific files
  python plugins/studytool/reformat_prose.py study/cormen.html study/tpu.html
"""

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_FILES = [
    REPO_ROOT / "study" / "ml.html",
    REPO_ROOT / "study" / "pmpp.html",
]

TITLE_PREFIXES = ("Intuition", "Mechanism", "Worked Example", "Pitfall")
MIN_LEN = 200
TARGET_PARA_LEN = 240
BLOCK_TAG_RE = re.compile(r"<(div|p\s|p>|ul\b|ol\b|table|svg|h\d)", re.IGNORECASE)
SECTION_PAT = re.compile(
    r'(\{\s*title:\s*")((?:[^"\\]|\\.)*?)("\s*,\s*text:\s*")((?:[^"\\]|\\.)*?)("\s*\})',
    re.DOTALL,
)
ENUM_PAT = re.compile(r"\(([1-9])\)\s*([^()]+?)(?=\s*\([1-9]\)|$)", re.DOTALL)
SENTENCE_SPLIT_PAT = re.compile(r"(?<=[.!?])\s+(?=[A-Z<(\[])")


def paragraphize(text: str) -> str:
    """Split prose into ~TARGET_PARA_LEN-char <p> chunks at sentence boundaries."""
    text = text.strip()
    if not text:
        return ""
    parts = [p.strip() for p in SENTENCE_SPLIT_PAT.split(text) if p.strip()]
    if not parts:
        return f"<p style='margin:0'>{text}</p>"
    paragraphs, cur, cur_len = [], [], 0
    for s in parts:
        cur.append(s)
        cur_len += len(s)
        if cur_len >= TARGET_PARA_LEN:
            paragraphs.append(" ".join(cur))
            cur, cur_len = [], 0
    if cur:
        paragraphs.append(" ".join(cur))
    if len(paragraphs) == 1:
        return f"<p style='margin:0'>{paragraphs[0]}</p>"
    out = "".join(f"<p style='margin:0 0 10px'>{p}</p>" for p in paragraphs[:-1])
    out += f"<p style='margin:0'>{paragraphs[-1]}</p>"
    return out


def transform(text: str) -> str:
    """Return restructured text (caller has already filtered by title/length)."""
    enum_items = ENUM_PAT.findall(text)
    if len(enum_items) >= 3:
        first_pos = text.find("(1)")
        lead = text[:first_pos].rstrip()
        if lead.endswith(":"):
            lead = lead[:-1].rstrip()
        last_item_text = enum_items[-1][1]
        last_pos = text.rfind(last_item_text) + len(last_item_text)
        trailing = text[last_pos:].strip()
        items = "".join(
            f"<li style='margin:3px 0'>{i[1].rstrip().rstrip(';.,').rstrip()}</li>"
            for i in enum_items
        )
        result = "<div style='line-height:1.65'>"
        if lead:
            result += paragraphize(lead) + (
                ":" if not lead.endswith(".") else ""
            )
        result += (
            f"<ol style='margin:8px 0 8px 22px;padding:0;line-height:1.65'>{items}</ol>"
        )
        if trailing:
            result += paragraphize(trailing)
        result += "</div>"
        return result
    return f"<div style='line-height:1.65'>{paragraphize(text)}</div>"


def title_matches(title: str) -> bool:
    return any(title.startswith(p) for p in TITLE_PREFIXES)


def process(content: str, stats: dict) -> str:
    def repl(m: "re.Match[str]") -> str:
        title, text = m.group(2), m.group(4)
        if not title_matches(title):
            stats["untouched_title"] += 1
            return m.group(0)
        if BLOCK_TAG_RE.search(text):
            stats["skipped_structured"] += 1
            return m.group(0)
        if len(text) < MIN_LEN:
            stats["skipped_short"] += 1
            return m.group(0)
        new_text = transform(text)
        if new_text == text:
            stats["already_clean"] += 1
            return m.group(0)
        stats["modified"] += 1
        return m.group(1) + title + m.group(3) + new_text + m.group(5)

    return SECTION_PAT.sub(repl, content)


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("files", nargs="*", type=Path,
                    help="HTML files to process (default: study/ml.html, study/pmpp.html)")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print stats but do not write files")
    args = ap.parse_args(argv)

    files = args.files or DEFAULT_FILES
    grand_total = {"modified": 0, "skipped_structured": 0,
                   "skipped_short": 0, "untouched_title": 0, "already_clean": 0}

    for path in files:
        if not path.exists():
            print(f"  ! missing: {path}", file=sys.stderr)
            continue
        original = path.read_text(encoding="utf-8")
        stats = {k: 0 for k in grand_total}
        updated = process(original, stats)
        action = "would write" if args.dry_run else "wrote"
        if updated != original and not args.dry_run:
            path.write_text(updated, encoding="utf-8")
        print(f"{path.name}: {stats}  ({action} {len(updated)} bytes)")
        for k, v in stats.items():
            grand_total[k] += v

    print(f"TOTAL: {grand_total}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
