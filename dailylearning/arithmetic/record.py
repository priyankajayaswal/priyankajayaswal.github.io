"""Record a scrolling walkthrough video of index.html using Playwright."""
import asyncio, os, pathlib, time
from playwright.async_api import async_playwright

HTML = pathlib.Path(__file__).parent / "index.html"
OUT_DIR = pathlib.Path(__file__).parent / "video"
OUT_DIR.mkdir(exist_ok=True)

# Continuous scroll settings — we traverse the ENTIRE page so nothing is missed.
# Pixels per "tick" and tick duration govern the scroll speed.
SCROLL_STEP_PX    = 80      # how far to jump per tick
SCROLL_TICK_MS    = 200     # ms between ticks  → ~400 px/s
PAUSE_EVERY_PX    = 1200    # linger for readability every N px
PAUSE_MS          = 600
INTRO_PAUSE_MS    = 2500
OUTRO_PAUSE_MS    = 2500

VIEWPORT = {"width": 1600, "height": 900}

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport=VIEWPORT,
            record_video_dir=str(OUT_DIR),
            record_video_size=VIEWPORT,
        )
        page = await ctx.new_page()
        url = HTML.resolve().as_uri()
        print(f"Opening {url}")
        await page.goto(url, wait_until="load")
        await page.wait_for_timeout(1500)

        # Make sure hash scrolling works by getting doc height
        total_h = await page.evaluate("document.documentElement.scrollHeight")
        print(f"Document height: {total_h}px  viewport={VIEWPORT['height']}px")

        # Intro pause at top
        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(INTRO_PAUSE_MS)

        # Continuous scroll from top to bottom — every pixel of the page is shown
        y = 0
        max_y = total_h - VIEWPORT["height"]
        next_pause_at = PAUSE_EVERY_PX
        while y < max_y:
            y = min(y + SCROLL_STEP_PX, max_y)
            await page.evaluate("(y) => window.scrollTo(0, y)", y)
            await page.wait_for_timeout(SCROLL_TICK_MS)
            if y >= next_pause_at:
                await page.wait_for_timeout(PAUSE_MS)
                next_pause_at += PAUSE_EVERY_PX

        # Linger at bottom
        await page.wait_for_timeout(OUTRO_PAUSE_MS)

        # Final fast scroll back to top
        await page.evaluate("window.scrollTo({top:0, behavior:'smooth'})")
        await page.wait_for_timeout(2500)

        # Close context so video is flushed
        await ctx.close()
        await browser.close()

        # Rename produced video file
        videos = sorted(OUT_DIR.glob("*.webm"), key=lambda p: p.stat().st_mtime)
        if videos:
            final = OUT_DIR / "arithmetic-walkthrough.webm"
            if final.exists():
                final.unlink()
            videos[-1].rename(final)
            print(f"Saved: {final}  ({final.stat().st_size/1024/1024:.2f} MB)")
        else:
            print("No video produced.")

asyncio.run(main())
