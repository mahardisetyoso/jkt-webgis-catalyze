# Jakarta — Lima Wajah Satu Kota

A scroll-driven **WebGIS storytelling** proof-of-concept that walks the viewer
through the five municipalities (kota administrasi) of DKI Jakarta, then opens
into a freely explorable map. Built for the Catalyze "WebGIS Development" case
study — a modern reconstruction of the digital-storytelling approach seen on
[lancastersound.wwf.ca](https://lancastersound.wwf.ca).

- **Live demo:** _<add Vercel URL after deploy>_
- **Full design doc:** [`docs/architecture.md`](docs/architecture.md) — end-to-end architecture, with diagrams.

The five chapters:

| District | Theme | Highlights |
|----------|-------|-----------|
| Jakarta Pusat | Business center (+ Sudirman congestion overlay) | Sudirman, SCBD |
| Jakarta Barat | Education & culinary | Trisakti, Untar, Ciputra, Tanjung Duren |
| Jakarta Selatan | Pop culture & entertainment | Blok M, Kemang |
| Jakarta Utara | Trade & Chinatown | PIK, Glodok |
| Jakarta Timur | Manufacturing industry | Pulogadung |

## Quick start

```bash
npm install
npm run data:districts    # build district boundaries from GADM (downloads once, cached)
npm run data:congestion   # build Sudirman congestion geohash cells
npm run data:images       # generate district placeholder images
npm run dev               # http://localhost:3000
```

```bash
npm test          # unit tests (Vitest)
npm run build     # static export to ./out
```

The generated data (`public/data/*.geojson`) and images (`public/images/*.svg`)
are committed, so `npm run dev` works without the data steps; rerun them only to
regenerate.

## System architecture

A **statically-exported Next.js app** — no application server. A single
full-viewport **MapLibre GL** map sits sticky behind a column of scrolling
narrative panels; **Scrollama** fires a chapter change as each panel enters view,
which flies the camera to that district, highlights its boundary (dimming the
others), reveals its landmarks, and — for Jakarta Pusat — shows the Sudirman
congestion overlay. After the last chapter an **explore mode** unlocks free
pan/zoom with layer toggles.

The narrative is **data, not code**: `lib/chapters.ts` + `lib/mapViews.ts` declare
what each chapter says, which image it shows, and where the camera goes. Components
are generic.

```
Browser (static SPA)  ──GET /data/*.geojson──▶  Vercel Edge CDN
                      ──XYZ tiles──────────────▶  OpenStreetMap (POC basemap)
```

**Backend is static-first, server-optional.** The data "API" is static GeoJSON
over the CDN; the only external call is the basemap tile endpoint. A dynamic tier
(vector tiles via PMTiles / a tile server over PostGIS, a serverless feature API,
or ArcGIS REST) is designed but deferred until a concrete trigger — see
[`docs/architecture.md`](docs/architecture.md) §6 for the thresholds.

## Data strategy

- **District boundaries:** [GADM 4.1](https://gadm.org) Indonesia ADM2, filtered to
  the five Jakarta kota (`NAME_1 = "JakartaRaya"`), coordinates rounded to ~1 m and
  committed as `public/data/jakarta-districts.geojson` (~13 KB). Built by
  `scripts/build-districts.mjs`.
  - **License note:** GADM restricts redistribution/commercial use, so only a
    simplified derivative is shipped, for this non-commercial assessment. For a
    public or commercial build, swap in [geoBoundaries](https://www.geoboundaries.org)
    (CC BY) or BPS / Jakarta Satu data — a one-file change in the build script.
- **Landmarks:** hand-authored `public/data/landmarks.geojson` (points per district).
- **Sudirman congestion:** `scripts/build-congestion.mjs` samples the Jalan Sudirman
  centerline, encodes each sample to a **geohash** (precision 7, ~150 m) with
  `ngeohash`, and emits one red (`status: "macet"`) cell polygon each. Static sample
  data; a live traffic feed would recolor these by real-time speed.
- **CRS:** WGS84 (EPSG:4326) in storage, Web Mercator at render time. Jakarta is
  equatorial, so the Arctic polar-stereographic projection the reference site needed
  (EPSG:5937) is deliberately **not** used here.

## Estimated timeline

A dated six-day build, Tue 3 Nov → Sun 8 Nov 2026 (full schedule with a Gantt chart
in [`docs/architecture.md`](docs/architecture.md) §13):

| Day | Focus |
|-----|-------|
| Tue 3 Nov | Scaffold + data pipeline (GADM, landmarks, congestion) |
| Wed 4 Nov | Chapter/camera model + MapCanvas (map, highlight, camera) |
| Thu 5 Nov | Hover + congestion + Scroller/Chapter UI |
| Fri 6 Nov | Explore mode + assembly + styling |
| Sat 7 Nov | Images + README + first Vercel deploy |
| Sun 8 Nov | QA (mobile, reduced-motion, data-failure) + submit |

Production build-out (real data pipeline + CMS, live traffic feed, multi-language,
QA, analytics): ~3–4 weeks.

## Features

- Linear scrollytelling with choreographed camera moves between districts
- Active-district highlight (others dimmed) + **hover-to-highlight** with name tooltip
- Clustered-free landmark markers per district
- **Sudirman traffic-congestion overlay** (geohash cells, red = *macet*)
- **Explore mode** after the story: free pan/zoom + layer toggles
- Respects `prefers-reduced-motion` (instant camera instead of fly)
- Trilingual-ready content model (currently Bahasa Indonesia)
- Fully static, Vercel-ready; 42 unit tests

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — the Next.js preset auto-detects `output: "export"` and
   serves the static build; no extra config needed.
3. Invite `catalyzecomms` to the GitHub repo and share the repo + Vercel links.

## Reverse-engineering note

The reference, `lancastersound.wwf.ca`, is a ~2016 RequireJS SPA using **Leaflet
0.7.7 + Proj4Leaflet** on a custom Arctic projection (EPSG:5937), a **Mapbox classic
raster** basemap, and **static TopoJSON/GeoJSON** data (with an optional ArcGIS REST
path), driven by declarative JSON config across three modes — scripted *story*,
*gallery*, and free-explore *layers*. This project keeps its best ideas (config-driven
narrative, named camera views, static-first data, story→explore arc) and modernizes
the stack (MapLibre + Next.js + Scrollama), uses real DOM text instead of pre-rendered
PNG scenes, and drops the custom projection because Jakarta is equatorial.

## Tech stack

Next.js 14 (static export) · TypeScript · MapLibre GL JS 4 · Scrollama 3 · ngeohash ·
Vitest + Testing Library · mapshaper/GADM for data · Vercel.

## Project structure

```
app/            Next.js App Router (layout, page, global CSS)
components/      MapCanvas, Scroller, Chapter, StoryApp, ExplorePanel
lib/            chapters, mapViews, mapLayers, useScrollChapter
scripts/        build-districts / build-congestion / build-images
public/data/     districts, landmarks, congestion GeoJSON
public/images/   district placeholder cards (+ CREDITS.md)
tests/           Vitest suites
docs/            architecture.md + implementation plan
```

## Credits & license

- Boundaries © GADM 4.1 (non-commercial; see data-strategy note above).
- Basemap © OpenStreetMap contributors.
- District images: original placeholders, CC0 — see
  [`public/images/CREDITS.md`](public/images/CREDITS.md).
