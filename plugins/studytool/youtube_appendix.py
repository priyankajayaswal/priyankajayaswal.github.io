"""
youtube_appendix.py — Studytool skill: Extract YouTube playlist videos and inject into index.html

Usage:
    python youtube_appendix.py <playlist_url> <index_html_path>
    python youtube_appendix.py --batch <folder>   # Process all subfolders with README.md

Requirements:
    pip install yt-dlp

This skill extracts video IDs and titles from a YouTube playlist using yt-dlp,
builds the `youtube` config block, and injects it into an existing study tool index.html.
"""
import subprocess, json, os, re, sys


def fetch_playlist(url):
    """Fetch playlist metadata using yt-dlp --flat-playlist."""
    try:
        r = subprocess.run(
            ["yt-dlp", "--flat-playlist", "-J", url],
            capture_output=True, text=True, timeout=120
        )
        if r.returncode != 0:
            print(f"  yt-dlp error: {r.stderr[:200]}")
            return None
        return json.loads(r.stdout)
    except FileNotFoundError:
        print("ERROR: yt-dlp not found. Install with: pip install yt-dlp")
        sys.exit(1)
    except subprocess.TimeoutExpired:
        print("  ERROR: yt-dlp timed out (120s)")
        return None
    except Exception as e:
        print(f"  ERROR: {e}")
        return None


def build_youtube_js(entries):
    """Build the youtube config JS string from playlist entries."""
    if not entries:
        return None

    videos_js = []
    unit_size = max(5, len(entries) // max(1, (len(entries) + 9) // 10))

    unit_names = {}
    for i, e in enumerate(entries):
        unit = (i // unit_size) + 1
        vid_id = e.get("id", "")
        title = e.get("title", f"Video {i+1}")
        # Escape for JS string
        title = title.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")
        videos_js.append(f'      {{ unit: {unit}, id: "{vid_id}", topic: "{title}" }}')
        if unit not in unit_names:
            end = min(i + unit_size, len(entries))
            unit_names[unit] = f"Unit {unit}: Lectures {i+1}-{end}"

    unit_names_js = ", ".join(f'{k}: "{v}"' for k, v in sorted(unit_names.items()))

    return f"""youtube: {{
    videos: [
{",".join(videos_js)}
    ],
    unitNames: {{ {unit_names_js} }}
  }}"""


def inject_youtube(fpath, youtube_js):
    """Replace empty youtube config in index.html with real video data."""
    if not os.path.isfile(fpath):
        print(f"  SKIP: {fpath} not found")
        return False

    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    # Try exact match first
    old = """youtube: {
    videos: [],
    unitNames: {}
  }"""

    if old in content:
        content = content.replace(old, youtube_js, 1)
    else:
        # Try regex for various formatting
        pat = r'youtube:\s*\{\s*videos:\s*\[\s*\]\s*,\s*unitNames:\s*\{\s*\}\s*\}'
        m = re.search(pat, content)
        if m:
            content = content[:m.start()] + youtube_js + content[m.end():]
        else:
            print(f"  WARN: No empty youtube block found. Already populated?")
            return False

    with open(fpath, "w", encoding="utf-8") as f:
        f.write(content)
    return True


def extract_playlist_url_from_readme(readme_path):
    """Extract YouTube playlist URL from a README.md file."""
    if not os.path.isfile(readme_path):
        return None
    with open(readme_path, "r", encoding="utf-8") as f:
        content = f.read()
    # Match YouTube playlist URLs
    m = re.search(r'https?://(?:www\.)?youtube\.com/playlist\?list=[A-Za-z0-9_-]+', content)
    return m.group(0) if m else None


def extract_playlist_url_from_index(index_path):
    """Extract YouTube playlist URL from an index.html sourceLink config."""
    if not os.path.isfile(index_path):
        return None
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
    m = re.search(r'sourceLink:\s*\{[^}]*url:\s*["\']([^"\']*youtube[^"\']*)["\']', content)
    return m.group(1) if m else None


def process_single(playlist_url, index_path):
    """Process a single playlist URL → index.html injection."""
    print(f"Fetching: {playlist_url}")
    data = fetch_playlist(playlist_url)
    if not data or not data.get("entries"):
        print("  FAIL: No entries found (playlist may be private/region-restricted)")
        return False

    entries = data["entries"]
    print(f"  Found {len(entries)} videos")

    youtube_js = build_youtube_js(entries)
    if youtube_js and inject_youtube(index_path, youtube_js):
        print(f"  OK: Injected {len(entries)} videos into {index_path}")
        return True
    return False


def process_batch(root_folder):
    """Process all subfolders that have index.html with empty youtube config."""
    results = {}
    for entry in sorted(os.listdir(root_folder)):
        full = os.path.join(root_folder, entry)
        if not os.path.isdir(full):
            continue

        index_path = os.path.join(full, "index.html")
        if not os.path.isfile(index_path):
            continue

        # Check if youtube is already populated
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()
        if 'videos: []' not in content:
            print(f"[{entry}] YouTube already populated, skipping")
            continue

        # Find playlist URL from index.html sourceLink or README.md
        url = extract_playlist_url_from_index(index_path)
        if not url:
            url = extract_playlist_url_from_readme(os.path.join(full, "README.md"))
        if not url:
            print(f"[{entry}] No YouTube playlist URL found, skipping")
            continue

        print(f"[{entry}] {url}")
        if process_single(url, index_path):
            results[entry] = True

    print(f"\n=== DONE: {len(results)} folders updated ===")
    for f in results:
        print(f"  ✅ {f}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python youtube_appendix.py <playlist_url> <index.html>")
        print("  python youtube_appendix.py --batch <folder>")
        sys.exit(1)

    if sys.argv[1] == "--batch":
        folder = sys.argv[2] if len(sys.argv) > 2 else "."
        process_batch(folder)
    else:
        if len(sys.argv) < 3:
            print("Usage: python youtube_appendix.py <playlist_url> <index.html>")
            sys.exit(1)
        process_single(sys.argv[1], sys.argv[2])
