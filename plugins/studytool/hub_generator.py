"""
hub_generator.py  --  Scans a root folder for HTML study tools and generates a hub index.html

Part of the studytool plugin. Generates a card-based landing page linking to all
study tools found in subdirectories.

Usage:
    python hub_generator.py [ROOT_DIR]         # One-shot scan & rebuild
    python hub_generator.py [ROOT_DIR] --watch # Watch for changes and auto-rebuild

    ROOT_DIR defaults to the current working directory if not specified.
"""
import os, re, html, sys, time, datetime

ROOT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else os.getcwd()
OUTPUT = os.path.join(ROOT, 'index.html')
SKIP = {'.git', 'node_modules', 'plugins', '__pycache__'}

ACCENTS = ['#f778ba','#58a6ff','#7ee787','#d2a8ff','#ffa657','#f0883e','#79c0ff','#ff9bce']
ICONS = {
    'security': '\U0001f6e1\ufe0f',
    'networking': '\U0001f310',
    'algo': '\u26a1',
    'maths': '\U0001f4d0',
    'health': '\U0001f9ec',
    'food': '\U0001f33f',
    'music': '\U0001f3b5',
    'physics': '\u269b\ufe0f',
    'finance': '\U0001f4b0',
    'language': '\U0001f5e3\ufe0f',
    'art': '\U0001f3a8',
    'history': '\U0001f4dc',
}
DEFAULT_ICON = '\U0001f4d8'


def get_meta(fpath):
    try:
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return None

    title = ''
    m = re.search(r'<title>([^<]+)</title>', content)
    if m:
        title = m.group(1).strip()

    code = ''
    m2 = re.search(r"code:\s*'([^']+)'", content)
    if m2:
        code = m2.group(1)
    cname = ''
    m3 = re.search(r"title:\s*'([^']+)'", content)
    if m3:
        cname = m3.group(1)
    if code and cname and code not in (title or ''):
        title = f'{code} \u2014 {cname}'

    desc = ''
    m4 = re.search(r'<meta\s+name="description"\s+content="([^"]+)"', content)
    if m4:
        desc = m4.group(1)

    typ = 'Project'
    if 'COURSE_CONFIG' in content:
        typ = 'Study Tool'
    elif re.search(r'mind.?map|d3', content, re.I):
        typ = 'Mind Map'
    elif re.search(r'planner|meal', content, re.I):
        typ = 'Planner'
    elif 'dashboard' in content.lower():
        typ = 'Dashboard'

    return {'title': title, 'desc': desc, 'type': typ, 'size': os.path.getsize(fpath)}


def scan_projects():
    projects = []
    for entry in sorted(os.listdir(ROOT)):
        full = os.path.join(ROOT, entry)
        if not os.path.isdir(full) or entry in SKIP or entry.startswith('.'):
            continue

        idx = os.path.join(full, 'index.html')
        if os.path.isfile(idx):
            meta = get_meta(idx)
            if meta:
                projects.append({'folder': entry, 'path': f'{entry}/index.html', **meta})

        for f in sorted(os.listdir(full)):
            fp = os.path.join(full, f)
            if f.endswith('.html') and f != 'index.html' and os.path.isfile(fp):
                if any(x in f.lower() for x in ['backup', 'old', 'temp']):
                    continue
                meta = get_meta(fp)
                if meta:
                    if not meta['title']:
                        meta['title'] = os.path.splitext(f)[0]
                    projects.append({'folder': entry, 'path': f'{entry}/{f}', **meta})
    return projects


def build_hub():
    projects = scan_projects()
    count = len(projects)

    cards = ''
    for i, p in enumerate(projects):
        accent = ACCENTS[i % len(ACCENTS)]
        icon = ICONS.get(p['folder'], DEFAULT_ICON)
        title = html.escape(p['title']) or p['folder']
        desc = html.escape(p['desc']) if p['desc'] else f"{p['folder']}/ &mdash; {p['size'] // 1024} KB"
        tag = p['type']
        cards += f'''
  <a class="card" href="{p['path']}" style="--accent:{accent}">
    <span class="card-icon">{icon}</span>
    <span class="card-title">{title}</span>
    <span class="card-folder">{p['folder']}/</span>
    <span class="card-desc">{desc}</span>
    <span class="tag" style="background:{accent}20;color:{accent}">{tag}</span>
  </a>'''

    now = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')

    page = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Study Hub \u2014 All Projects</title>
<style>
  *{{margin:0;padding:0;box-sizing:border-box}}
  body{{background:#0d1117;color:#e6edf3;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:40px 20px}}
  h1{{font-size:2rem;margin-bottom:8px;background:linear-gradient(135deg,#58a6ff,#d2a8ff,#f778ba);-webkit-background-clip:text;-webkit-text-fill-color:transparent}}
  .subtitle{{color:#8b949e;font-size:.95rem;margin-bottom:36px}}
  .grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;max-width:1100px;width:100%}}
  a.card{{text-decoration:none;color:inherit;background:#161b22;border:1px solid #30363d;border-radius:12px;padding:24px;transition:transform .18s,border-color .18s,box-shadow .18s;display:flex;flex-direction:column;gap:10px}}
  a.card:hover{{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 8px 24px rgba(0,0,0,.4)}}
  .card-icon{{font-size:2.2rem}}
  .card-title{{font-size:1.15rem;font-weight:700;color:#e6edf3}}
  .card-folder{{font-size:.78rem;color:#8b949e;font-family:"SFMono-Regular",Consolas,monospace;background:#21262d;display:inline-block;padding:2px 8px;border-radius:4px;width:fit-content}}
  .card-desc{{font-size:.88rem;color:#8b949e;line-height:1.5}}
  .tag{{display:inline-block;font-size:.7rem;padding:2px 8px;border-radius:10px;font-weight:600;margin-top:auto}}
  footer{{margin-top:48px;color:#484f58;font-size:.8rem;text-align:center;line-height:1.6}}
  footer span{{color:#6e7681}}
</style>
</head>
<body>

<h1>\U0001f4da Study Hub</h1>
<p class="subtitle">Interactive study tools &amp; mind maps \u2014 click to open</p>

<div class="grid">
{cards}
</div>

<footer>{count} projects \u00b7 C:\\src<br><span>Auto-generated {now} \u00b7 run update-hub to refresh</span></footer>

</body>
</html>'''

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(page)
    print(f'[hub] Generated {OUTPUT} with {count} projects')


def watch():
    print(f'[hub] Watching {ROOT} for *.html changes (Ctrl+C to stop)...')
    build_hub()

    def snapshot():
        s = {}
        for entry in os.listdir(ROOT):
            full = os.path.join(ROOT, entry)
            if not os.path.isdir(full) or entry in SKIP or entry.startswith('.'):
                continue
            for f in os.listdir(full):
                if f.endswith('.html'):
                    fp = os.path.join(full, f)
                    try:
                        s[fp] = os.path.getmtime(fp)
                    except OSError:
                        pass
        return s

    prev = snapshot()
    while True:
        time.sleep(2)
        curr = snapshot()
        if curr != prev:
            changed = set(curr.keys()) ^ set(prev.keys())
            modified = {k for k in curr if k in prev and curr[k] != prev[k]}
            diff = changed | modified
            for p in diff:
                if p != OUTPUT:
                    print(f'[hub] Change detected: {p}')
                    build_hub()
                    break
            prev = curr


if __name__ == '__main__':
    if '--watch' in sys.argv:
        watch()
    else:
        build_hub()
