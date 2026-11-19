# Leonida Ledger — GTA VI Trophy Guide & Tracker

[![GTA 6 trophy guide bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/kiroroai/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/kiroroai/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver and 46 bronze, 28 of them hidden. Every trophy shows its official name, description and grade exactly as PlayStation publishes it, plus a guide in this project's own words that names its sources beside it. The tracker saves your progress in the browser (localStorage), with filters by kind and grade, a spoiler setting that hides story trophies until you earn them, and export/import of your progress. A three-step roadmap to the platinum and a missables page are built from the official descriptions and from PowerPyx's trophy guide.

The game launched 19 November 2026, so five trophies' exact methods are still unconfirmed anywhere — the guide says so plainly for each of them instead of inventing a location. No Rockstar logo, artwork or game screenshots are used anywhere.

## Run it

No build step, no network needed. Serve `app/` with any static file server and open `index.html`:

```sh
node serve.ts
# then open http://localhost:8080
```

Or open `app/index.html` directly from the files. The app loads only its own files — `app/data/trophies.json` holds the 55 trophies, their guides and their sources.

## What is inside

- `app/` — the guide itself: `index.html`, `style.css`, `app.js`, `data/trophies.json`
- `screenshots/` — four renders of the app: checklist with a guide open, roadmap, tracker with spoilers on, collectibles guide
- `main.ts` — the entry program (Node 22, standard library only): copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`
- `serve.ts` — a tiny static server for local use
- `shots.json` — which views the screenshots were taken of

## Sources

Trophy names, descriptions and grades: [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). Methods and roadmap: [PowerPyx — GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/), cross-checked against [Planet GTA 6](https://www.planetgta6.com/en/gta-6-trophies/) and [Output Lag](https://outputlag.com/guides/gta-6-trophy-list/). Every trophy's guide in the app names the sources its facts come from.

---

Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.
