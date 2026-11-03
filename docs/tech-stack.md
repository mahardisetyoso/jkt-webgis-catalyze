# Jakarta Scrollytelling WebGIS — Tech Stack

**Companion to:** [`architecture.md`](architecture.md) · **Interactive overview:** [`design/tech-stack.html`](design/tech-stack.html)

[![Tech stack overview](design/tech-stack.png)](design/tech-stack.html)

The stack follows one principle (architecture §2): **a static frontend on a CDN, reading live geodata from an open-source geospatial backend**. The app never needs a server; the data does. A GeoJSON snapshot exported from PostGIS at build time is bundled as the fallback.

**Status** — ✅ in this repo today · 🔜 live backend, specified in architecture §6 and not stood up yet.

---

## 1. Frontend (static)

| Technology | Version | Role | Status | Where |
|---|---|---|---|---|
| **Next.js** | 14, App Router, `output: 'export'` | Static export to `out/`; no SSR or serverless, in POC and in live mode alike | ✅ | `app/`, `next.config.mjs` |
| **TypeScript** | — | Typed narrative and camera config; bad district ids or coordinates fail at build | ✅ | `lib/`, `types/` |
| **MapLibre GL JS** | 4 | WebGL map: camera, district highlight, hover tooltip, landmarks, congestion layer. Its `source` abstraction reads either GeoServer or the bundled snapshot | ✅ | `components/MapCanvas.tsx`, `lib/mapLayers.ts` |
| **Scrollama** | 3 | Fires a chapter change as each panel scrolls into view | ✅ | `lib/useScrollChapter.ts` |
| **MapTiler** | `dataviz-dark` style | Vector basemap with a domain-restricted key; OSM raster (darkened) when no key is set | ✅ | `lib/basemap.ts` |

## 2. Live geospatial backend

| Technology | Role | Status | Notes |
|---|---|---|---|
| **PostGIS** (PostgreSQL) | Single source of truth for districts, landmarks and congestion; GiST indexes; EPSG:4326 storage | 🔜 | Read-only roles for GeoServer and CI |
| **GeoServer** | Serves PostGIS layers as **WFS** (GeoJSON) and **WMTS**; SLD styling | 🔜 | The data API the static app calls from the browser |
| **GeoWebCache** | Tile cache inside GeoServer | 🔜 | Pre-renders heavy / slow-changing layers |
| **nginx gateway** | TLS, CORS, rate limiting, response cache; keeps GeoServer admin private | 🔜 | Or a Vercel rewrite `/geo/* → gateway` for same-origin calls |
| **Docker Compose** | Runs `postgis`, `geoserver` and the gateway reproducibly | 🔜 | Managed alternative: RDS / Cloud SQL + a GeoServer container |

## 3. Authoring

| Technology | Role | Status | Notes |
|---|---|---|---|
| **QGIS Desktop** | Edit geometry and attributes directly in PostGIS; spatial analysis; author styles (SLD/QML) and publish them to GeoServer | 🔜 | Used by analysts, never called by the app |

## 4. Data pipeline

| Technology | Role | Status | Where |
|---|---|---|---|
| **GADM 4.1** (ADM2) | Boundaries of the five kota. Today: seeds the snapshot directly. Live: seeds PostGIS once | ✅ | `scripts/build-districts.mjs` |
| **mapshaper** | Simplifies boundary geometry (~13 KB output) | ✅ | district build |
| **ngeohash** | Encodes the Sudirman centerline into precision-7 geohash cells (~150 m) | ✅ | `scripts/build-congestion.mjs` |
| **GDAL / `ogr2ogr`** | Exports the GeoJSON snapshot from PostGIS before `next build`; also loads seed data into PostGIS | 🔜 | CI step, architecture §6.6 |
| **Traffic feed ETL** | Upserts live speeds into PostGIS, replacing the static congestion sample | 🔜 | Roadmap v3 |

## 5. Delivery and QA

| Technology | Role | Status | Where |
|---|---|---|---|
| **Vercel** (Edge CDN) | Hosts the static app and the bundled snapshot; Git integration builds every push | ✅ | Project → Settings → Environment Variables |
| **GitHub** | Source, PR previews via Vercel | ✅ | — |
| **Vitest + Testing Library** (jsdom) | Unit tests for chapter/camera model, paint helpers and components (70 tests) | ✅ | `tests/`, `vitest.config.ts` |

---

## Configuration switches

The frontend is the same build artifact in every mode; build-time environment variables pick the sources.

| Variable | Set | Empty |
|---|---|---|
| `NEXT_PUBLIC_MAPTILER_KEY` | MapTiler vector basemap | OSM raster, darkened |
| `NEXT_PUBLIC_GEOSERVER_URL` 🔜 | Layers read GeoServer WFS/WMTS; snapshot is the fallback | Snapshot only (today's POC) |

## Why these, not the alternatives

The full decision record is architecture §11. In short: **MapLibre** over Mapbox/Leaflet (open, vector, no token); **PostGIS + GeoServer** over a serverless feature API (OGC standards, server-side spatial queries, tiling, live data); **QGIS** over ArcGIS Pro (free, native PostGIS editing and GeoServer publishing); **Next.js static export** over SSR (the story UI is identical for every visitor, so only the data tier needs servers).
