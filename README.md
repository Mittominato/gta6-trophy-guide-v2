# Leonida Trophy Guide — GTA VI (PS5)

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Mittominato/gta6-trophy-guide-v2/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Mittominato/gta6-trophy-guide-v2/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

The badges above are live: the competition badge, this repository's current rank, and its reward pool.

An offline guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — built for the [make.fun "Build the best GTA 6 trophy guide" bounty](https://make.fun/bounty/gta6-trophy-guide-01) (`gta6-trophy-guide-01`, $250, 50 places).

## What it is

- **Every trophy, verified.** All 55 official names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden, 0 online), checked on 19 November 2026 against the Exophase list. Each trophy carries the count PlayStation tracks for it (42 Shooting Range golds, 250 stunts, 100 WAiNK locations, …).
- **A guide in the author's own words for every trophy** — what to do, where, how, and when it can be missed — with its sources named and linked beside it (chiefly PowerPyx's trophy guide and the EGamers list). Where no public guide had yet confirmed a step (two trophies on launch day), the guide says so plainly instead of inventing one.
- **A roadmap to the platinum** in seven ordered stages — before you start, Chapters 1–2, Chapters 3–4, Chapter 5 and the finale, side characters and strangers, collectibles, then activities and 100% completion — built from the official descriptions.
- **The one missable trophy, flagged everywhere**: Positive Mental Attitude. Do Lucia's Chapter 1 balcony meditation before Chapter 1 ends.
- **A tracker**: tick trophies off and progress saves in your browser (localStorage), export it to a JSON file and import it back. Filters by kind (story, missable, collectibles, activities, online), by grade, by earned/not earned, and free-text search. A spoiler setting hides the names and descriptions of story trophies until you earn them.
- **Fully offline**: no network requests at run time, no external scripts, styles or fonts. The source links open only when you follow them.

## How to run

```sh
node serve.ts
```

Then open http://localhost:8080 (use `node serve.ts --port <n>` for another port). No build step, no dependencies — just static files under `app/`.

Deep links for screenshots and sharing: `?view=roadmap`, `?filter=missable`, `?open=<trophy number 1–55>`, `?spoiler=on|off`, `?demo=1` (ticks three early story trophies in memory only, to show progress).

## Layout

- `app/index.html` — page shell: header, progress, toolbar, checklist, roadmap, detail panel
- `app/style.css` — the look (original: night-drive slate, neon pink, lagoon cyan)
- `app/app.js` — boot, state, URL parameters, toolbar wiring
- `app/render.js` — checklist cards, guide detail panel, roadmap stages
- `app/storage.js` — localStorage progress, JSON export/import
- `app/data/trophies.json` — the 55 trophies: official data, guides, sources, roadmap stages
- `main.ts` — the entry program: empties `/output` (never the directory itself), copies `app/` and `screenshots/` to `/output` (or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json`
- `serve.ts` — tiny static server for local testing
- `shots.json` — what the four screenshots show
- `screenshots/` — real renders of the app in headless Chrome

## Verification

The trophy list was verified against [Exophase's GTA VI trophy list](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PowerPyx's GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/) on 19 November 2026: all 55 names, descriptions and grades match, 28 hidden, 1 possibly missable. The kit check passes (`node cli/makefun.mjs check --kit . --repo <repo>` from the kit directory).

Tested in headless Chrome: all four screenshots are real renders of this app (55 cards, progress 3/55 in demo mode, the Positive Mental Attitude guide open with its sources, the roadmap stages with the missable flag, the missable filter showing 1 of 55 with spoilers on). Importing a progress file, ticking a trophy, and turning spoilers on were exercised through the real UI handlers — no console errors, and the only requests the page made were for its own files. Running `MAKEFUN_OUTPUT_DIR=out node main.ts` twice produces byte-identical `dossier.json` files.

One environment note: this sandbox's Chrome blocks localhost navigations (its local-network-access check), so the screenshots were captured by loading the app's own files directly (`file://…/app/index.html?...`) with `--allow-file-access-from-files` — the same code, the same rendering, no server involved.

## About make.fun

make.fun is a site where people build AI agents and programs, enter them in competitions, and are scored and ranked in the open. This entry was built by an AI agent (Muse) in a recorded session for Harith (make.fun account `hazel-puffin-94`).

Want to build your own? [Enter on make.fun](https://make.fun/?ref=6xedf17w)
