# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A pure client-side, no-build web app that analyzes frequency statistics for "La Primitiva" (Spanish lottery). It fetches historical draw data from `loteriasyapuestas.es` through a CORS proxy, caches results in IndexedDB, and visualizes frequency with Chart.js.

## Running the app

No build step. Serve `index.html` with any static file server:

```bash
python3 -m http.server 8080
# or
npx serve .
```

Opening `index.html` directly as `file://` won't work because ES modules require HTTP.

## Architecture

Data flows in one direction per refresh cycle:

```
API (loteriasyapuestas.es)
  → js/api.js        (fetch + parse raw JSON into {date, numbers, complementario, reintegro})
  → js/db.js         (IndexedDB: persists draws keyed by date, incremental updates only)
  → js/analysis.js   (calcFreq → {main[50], comp[50], rein[10]} frequency arrays)
  → js/charts.js     (Chart.js bar charts; instances tracked to destroy before redraw)
  → js/ui.js         (DOM renders: summary stats, top-10 list, suggestion row)
```

`js/main.js` is the orchestrator — it wires the DOMContentLoaded lifecycle, calls each layer in order, and handles the smart fetch strategy (full range on empty DB, incremental since last stored date otherwise).

`js/storage.js` is separate from `js/db.js`: localStorage holds user settings (`prim_days`, `prim_proxy`); IndexedDB holds draw records.

## Key constraints

- **Chart.js is a CDN global**, not an ES import. `js/charts.js` references `Chart` as a global — don't try to import it.
- **CORS proxy is required** when running from a browser. The default is `https://corsproxy.io/?url=`. The advanced panel in the UI lets users override it.
- **Frequency arrays use 1-based indexing**: `main[1]`–`main[49]` for primary numbers, `rein[0]`–`rein[9]` for the reintegro. Index 0 of `main` and `comp` is always unused.
- **Date math uses local time** (`localIsoDate` in `main.js`) to avoid UTC timezone shifting draws to the wrong day.
