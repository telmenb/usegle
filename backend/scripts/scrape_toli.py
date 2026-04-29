#!/usr/bin/env python3
"""
Scrape all words + definitions from toli.gov.mn.

Strategy:
  Phase 1 – paginate /l/<letter>?page=N for every letter to collect (word, slug) pairs.
  Phase 2 – fetch /w/<slug> for each slug to extract the full definition and POS tag.

Output: data/toli_words.jsonl  (one JSON object per line)
  {"word": "үнэн", "slug": "FwyVHxc3DUaFLUJK", "pos": "[тэ.н]", "meaning": "жинхэнэ, бодит байдалд тохирсон"}

Resume-safe: already-fetched slugs are skipped on restart.

Usage:
  pip install aiohttp
  python scripts/scrape_toli.py [--concurrency 8] [--delay 0.05] [--out data/toli_words.jsonl]
"""

import asyncio
import argparse
import json
import re
import sys
import time
import urllib.parse
from pathlib import Path

import aiohttp

BASE = "https://toli.gov.mn"
HEADERS = {"User-Agent": "usegle-scraper/1.0 (educational; contact: usegle project)"}


# ---------------------------------------------------------------------------
# HTML helpers
# ---------------------------------------------------------------------------

def _strip_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", "", html).strip()


def parse_letter_page(html: str) -> list[tuple[str, str]]:
    """Return list of (word, slug) from a /l/<letter> listing page."""
    pairs = []
    pattern = re.compile(r'<a href="https://toli\.gov\.mn/w/([^"]+)">([^<]+)</a>')
    for m in pattern.finditer(html):
        slug, word = m.group(1), m.group(2).strip()
        if slug and word:
            pairs.append((word, slug))
    return pairs


def max_page(html: str) -> int:
    """Extract the highest page number from pagination links."""
    nums = [int(n) for n in re.findall(r"page=(\d+)", html)]
    return max(nums, default=1)


def parse_word_page(html: str) -> tuple[str, str]:
    """Return (pos, meaning) from a /w/<slug> detail page."""
    # Page always starts with [0] as a numeric ID bracket; real POS is the second bracket.
    brackets = re.findall(r"\[([^\]]+)\]", html)
    pos = f"[{brackets[1]}]" if len(brackets) > 1 else ""

    # Full definition lives in class="word-meaning" div
    meaning_match = re.search(
        r'class="word-meaning"[^>]*>\s*(.*?)\s*</div>', html, re.DOTALL
    )
    meaning = _strip_tags(meaning_match.group(1)) if meaning_match else ""

    return pos, meaning


# ---------------------------------------------------------------------------
# Async fetching
# ---------------------------------------------------------------------------

async def fetch(session: aiohttp.ClientSession, url: str, retries: int = 3) -> str | None:
    for attempt in range(retries):
        try:
            async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 200:
                    return await resp.text()
                if resp.status == 429:
                    wait = 2 ** attempt
                    print(f"  rate-limited, waiting {wait}s …", file=sys.stderr)
                    await asyncio.sleep(wait)
                else:
                    print(f"  HTTP {resp.status} for {url}", file=sys.stderr)
                    return None
        except Exception as e:
            if attempt == retries - 1:
                print(f"  failed {url}: {e}", file=sys.stderr)
                return None
            await asyncio.sleep(1)
    return None


# ---------------------------------------------------------------------------
# Phase 1: discover all (word, slug) pairs
# ---------------------------------------------------------------------------

async def discover_letters(session: aiohttp.ClientSession) -> list[str]:
    html = await fetch(session, BASE)
    if not html:
        return []
    raw = re.findall(r'href="https://toli\.gov\.mn/l/([^"]+)"', html)
    letters = [urllib.parse.unquote(l) for l in dict.fromkeys(raw)]  # deduplicated, ordered
    print(f"Found {len(letters)} letters: {' '.join(letters)}")
    return letters


async def discover_letter(
    session: aiohttp.ClientSession,
    letter: str,
    delay: float,
) -> list[tuple[str, str]]:
    """Collect all (word, slug) pairs for one letter by paginating /l/<letter>."""
    encoded = urllib.parse.quote(letter)
    url1 = f"{BASE}/l/{encoded}?page=1"
    html = await fetch(session, url1)
    if not html:
        return []

    total_pages = max_page(html)
    pairs = parse_letter_page(html)
    print(f"  {letter}: {total_pages} pages", end="", flush=True)

    tasks = []
    for page in range(2, total_pages + 1):
        tasks.append(fetch(session, f"{BASE}/l/{encoded}?page={page}"))
        await asyncio.sleep(delay)

    results = await asyncio.gather(*tasks)
    for html in results:
        if html:
            pairs.extend(parse_letter_page(html))

    print(f" → {len(pairs)} entries")
    return pairs


async def phase1(session: aiohttp.ClientSession, delay: float) -> list[tuple[str, str]]:
    print("=== Phase 1: discovering words ===")
    letters = await discover_letters(session)

    all_pairs: list[tuple[str, str]] = []
    seen_slugs: set[str] = set()

    for letter in letters:
        pairs = await discover_letter(session, letter, delay)
        for word, slug in pairs:
            if slug not in seen_slugs:
                seen_slugs.add(slug)
                all_pairs.append((word, slug))
        await asyncio.sleep(delay)

    print(f"Phase 1 complete: {len(all_pairs)} unique slugs")
    return all_pairs


# ---------------------------------------------------------------------------
# Phase 2: fetch definitions
# ---------------------------------------------------------------------------

async def fetch_definition(
    session: aiohttp.ClientSession,
    word: str,
    slug: str,
    semaphore: asyncio.Semaphore,
    delay: float,
) -> dict | None:
    async with semaphore:
        html = await fetch(session, f"{BASE}/w/{slug}")
        await asyncio.sleep(delay)
        if not html:
            return None
        pos, meaning = parse_word_page(html)
        return {"word": word, "slug": slug, "pos": pos, "meaning": meaning}


async def phase2(
    session: aiohttp.ClientSession,
    pairs: list[tuple[str, str]],
    out_path: Path,
    concurrency: int,
    delay: float,
) -> None:
    print("=== Phase 2: fetching definitions ===")

    # Load already-completed slugs so we can resume
    done_slugs: set[str] = set()
    if out_path.exists():
        with out_path.open(encoding="utf-8") as f:
            for line in f:
                try:
                    done_slugs.add(json.loads(line)["slug"])
                except Exception:
                    pass
        print(f"Resuming: {len(done_slugs)} slugs already done, {len(pairs) - len(done_slugs)} remaining")

    remaining = [(w, s) for w, s in pairs if s not in done_slugs]
    semaphore = asyncio.Semaphore(concurrency)

    with out_path.open("a", encoding="utf-8") as out_file:
        batch_size = concurrency * 4
        total = len(remaining)
        done = 0
        start = time.monotonic()

        for i in range(0, total, batch_size):
            batch = remaining[i : i + batch_size]
            tasks = [
                fetch_definition(session, word, slug, semaphore, delay)
                for word, slug in batch
            ]
            results = await asyncio.gather(*tasks)
            for rec in results:
                if rec:
                    out_file.write(json.dumps(rec, ensure_ascii=False) + "\n")
            out_file.flush()

            done += len(batch)
            elapsed = time.monotonic() - start
            rate = done / elapsed if elapsed > 0 else 0
            eta = (total - done) / rate if rate > 0 else 0
            print(
                f"  {done}/{total}  ({rate:.1f} words/s  ETA {eta/60:.1f} min)",
                flush=True,
            )

    print(f"Phase 2 complete. Output: {out_path}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main(args: argparse.Namespace) -> None:
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Cache the slug list so phase 1 doesn't re-run on resume
    slug_cache = out_path.with_suffix(".slugs.jsonl")

    connector = aiohttp.TCPConnector(limit=args.concurrency + 4)
    async with aiohttp.ClientSession(connector=connector) as session:
        if slug_cache.exists():
            with slug_cache.open(encoding="utf-8") as f:
                pairs = [tuple(json.loads(l)) for l in f if l.strip()]
            print(f"Loaded {len(pairs)} slugs from cache ({slug_cache})")
        else:
            pairs = await phase1(session, args.delay)
            with slug_cache.open("w", encoding="utf-8") as f:
                for pair in pairs:
                    f.write(json.dumps(list(pair), ensure_ascii=False) + "\n")
            print(f"Slug list saved to {slug_cache}")

        await phase2(session, pairs, out_path, args.concurrency, args.delay)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape toli.gov.mn dictionary")
    parser.add_argument("--concurrency", type=int, default=6, help="parallel fetches (default 6)")
    parser.add_argument("--delay", type=float, default=0.05, help="seconds between requests per coroutine (default 0.05)")
    parser.add_argument("--out", default="data/toli_words.jsonl", help="output file (default data/toli_words.jsonl)")
    args = parser.parse_args()
    asyncio.run(main(args))
