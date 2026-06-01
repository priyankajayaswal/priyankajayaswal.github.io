# 🧠 SRS — Self-Hosted Spaced Repetition (GitHub Pages compatible)

A minimal, fully static, Anki-like spaced repetition app you can host **free on GitHub Pages** in 5 minutes. No backend, no accounts, no install — just a browser.

## Why this instead of real Anki?

| | This SRS (GitHub Pages) | Real Anki (desktop) |
|--|------------------------|----------------------|
| Hosting | Free, static, your domain | Local app, sync via AnkiWeb |
| Decks under version control | ✅ (JSON in your repo) | ❌ (binary .anki2 DB) |
| Sharing decks with others | Just a URL | `.apkg` file dance |
| Per-user progress | `localStorage` (per browser) | Robust sync to all your devices |
| Scheduler | SM-2 (original Anki) | FSRS (newer, smarter) |
| Mobile-quality UX | Basic | Native apps, polished |
| Offline | ✅ (after first load) | ✅ |
| **Best for** | Sharing structured decks with a team / community | Personal daily use |

**TL;DR:** use this for *publishing* a curated study deck others can review in a browser. Use real Anki for *your own* daily reviews with cross-device sync.

## Layout

```
srs-pages/
├── index.html        ← the whole app (single file, no build)
├── decks/
│   ├── index.json    ← deck catalog
│   └── tpu.json      ← the actual deck (98 cards converted from tpu_deck.csv)
└── README.md         ← this file
```

## Adding a deck

1. Convert your CSV/TSV deck to JSON with this shape:
   ```json
   {
     "name": "My Deck",
     "description": "...",
     "cards": [
       { "front": "Q?", "back": "<b>A</b>", "tags": ["t1", "t2"] }
     ]
   }
   ```
   HTML in `back` is rendered.
2. Save it to `decks/my-deck.json`.
3. Add an entry to `decks/index.json`:
   ```json
   { "id": "my-deck", "file": "my-deck.json", "title": "My Deck", "icon": "🎯", "count": 42 }
   ```

A PowerShell one-liner to convert any `.csv` (tab-separated, like the Anki export format) to JSON is in `convert.ps1` (see below).

## Deploy to GitHub Pages — 5 minutes

```bash
# 1. From this folder
cd C:\code\learning\srs-pages
git init
git add .
git commit -m "Initial SRS app"

# 2. Create a new public repo on GitHub (e.g., 'srs')
git remote add origin https://github.com/<you>/srs.git
git branch -M main
git push -u origin main

# 3. On GitHub: Settings → Pages → Source = "Deploy from branch", branch = main, folder = / (root)
# 4. Wait ~30 sec → site live at https://<you>.github.io/srs/
```

That's it. Anyone with the URL gets the deck; their progress lives in *their* browser's localStorage.

## Daily use

- Open the URL → pick a deck → press **Space** to reveal, then **1 / 2 / 3 / 4** to grade (Again / Hard / Good / Easy)
- Cards rescheduled by SM-2 — overdue ones float to the top of the queue tomorrow
- Progress is per-browser. Use **⬇ Export progress** to save a JSON snapshot; **⬆ Import progress** on another device to restore. Manual sync, but it's bulletproof.

## Sync options (because GitHub Pages has no backend)

| Option | Effort | Cross-device | Notes |
|--------|-------:|:-------------|-------|
| **Export/Import JSON** (built-in) | 0 | Manual | Email yourself the file. Works offline. |
| **GitHub Gist sync** | ~30 LoC | Auto | Needs a personal access token (PAT) — add a `Sync` button that PUTs `localStorage` to a private gist. Cross-device, but the PAT lives in your browser. |
| **Free Firebase / Supabase** | ~60 LoC | Auto + multi-user | Free tier covers personal use. Adds an account system. |
| **Real Anki sync server (Approach C)** | A day | Auto + multi-user + mobile | Self-hosted on Fly.io / Render free tier. Pointed-at by Anki desktop + mobile. Best UX but not GH Pages. |

## Limitations (be honest)

- **No FSRS yet** — SM-2 is fine for thousands of cards but ~15-20% less efficient than Anki's modern FSRS.
- **Per-browser progress** — without sync, reviews on phone don't show up on laptop. Use the export/import button until you wire one of the sync options.
- **No image / audio cards** out of the box — easy to add (just embed `<img src="...">` in the back field; host images alongside the deck).
- **No clozes** — front/back only. Could add `{{c1::...}}` parsing in ~40 LoC if you want it.
- **No reverse cards** — write the reverse manually as a second card, or extend `loadDeck` to auto-generate.

For a personal daily-use SRS where these matter, real Anki is still the right answer. For a published study tool that lives next to your `learn.html` and `study/` content, this is the right shape.

## Convert your CSV decks to JSON

PowerShell one-liner (Windows):

```powershell
$cards = @(); Get-Content my-deck.csv | ? {$_ -notmatch '^#' -and $_.Trim()} | % {
  $p = $_ -split "`t"; $cards += @{ front=$p[0]; back=$p[1]; tags=@($p[2] -split ' '|?{$_}) }
}
@{name='My Deck'; cards=$cards} | ConvertTo-Json -Depth 5 | Set-Content decks\my-deck.json
```

Python equivalent:

```python
import csv, json
cards = []
with open('my-deck.csv') as f:
    for row in csv.reader(f, delimiter='\t'):
        if row and not row[0].startswith('#'):
            cards.append({'front': row[0], 'back': row[1], 'tags': row[2].split() if len(row)>2 else []})
json.dump({'name':'My Deck','cards':cards}, open('decks/my-deck.json','w'), indent=2)
```
