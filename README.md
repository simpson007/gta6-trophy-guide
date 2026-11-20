# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/simpson007/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/simpson007/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

The Leonida Campaign — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Instead of a flat trophy list, it plays as a four-phase campaign to the platinum: play the story, meet the strangers, sweep the map, then grind the long road. Every trophy carries its official name, description and grade, a guide in our own words that cites its sources, and a flag when it can be missed. The tracker saves progress in the browser (localStorage), with per-trophy counters for counted goals, filters by kind, a spoiler setting that hides story trophies until earned, and export/import of progress.

## Run it

```sh
node serve.ts
# open http://localhost:8080/
```

Or serve the `app/` folder with any static server — the app works with the network off.

## What is inside

- `app/index.html` — the guide's shell: progress bar, search, filters, spoiler toggle, export/import.
- `app/css/campaign.css` — the original dusk look; no Rockstar artwork or logos anywhere.
- `app/js/main.js` — boots the guide and wires the controls.
- `app/js/state.js` — the tracker state in localStorage, plus export/import and a `?demo=1` mid-run seed for screenshots.
- `app/js/data.js` — loads the trophy list and the campaign phases from the app's own files.
- `app/js/views.js` — the campaign roadmap, the checklist and the guide drawer.
- `app/js/filters.js` — kind filters, search, and spoiler masking.
- `app/data/trophies.json` — all 55 trophies with official names, descriptions, grades, hidden flags, goals, missable flags, sources and guides.
- `app/data/campaign.json` — the four phases, in play order, with their milestones.
- `screenshots/` — three renders of the running app: the campaign, a guide open beside the checklist, and the spoiler setting at work.
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to `/output` and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ngqr1ydj&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
