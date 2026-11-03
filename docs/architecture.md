# Jakarta Scrollytelling WebGIS — End-to-End Architecture

**Author:** Dimas · **Date:** 2026-11-03 · **Status:** Design / spec for the Catalyze case study
**Companion plan:** [`docs/superpowers/plans/2026-11-03-jakarta-scrollytelling-webgis.md`](superpowers/plans/2026-11-03-jakarta-scrollytelling-webgis.md)

---

## 1. Purpose and scope

A web application that walks a visitor through the **five municipalities (kota administrasi) of DKI Jakarta** as a scripted, scroll-driven narrative, ending in an interactive map. It is the Catalyze "WebGIS Development" case study — a modern reconstruction of the storytelling approach seen on [`lancastersound.wwf.ca`](https://lancastersound.wwf.ca), applied to Jakarta.

**In scope (POC):** the scrollytelling experience, five district narratives + landmark highlights, boundary + point geodata, a **hover-to-highlight** interaction on district polygons, a **traffic-congestion layer** (geohash cells along Jalan Sudirman, red = *macet*), a free **explore mode** after the story, and Vercel deployment.
**Out of scope (POC):** CMS, authentication, write APIs, live/real-time traffic feeds (congestion is static sample data), multi-language UI (noted as an evolution step).

The narrative (simple, Bahasa Indonesia):

| # | District | Theme | Highlights |
|---|----------|-------|-----------|
| 1 | Jakarta Pusat | Business center | Sudirman, SCBD |
| 2 | Jakarta Barat | Education & culinary | Trisakti, Untar, Ciputra, Tanjung Duren |
| 3 | Jakarta Selatan | Pop culture & entertainment | Blok M, Kemang |
| 4 | Jakarta Utara | Trade & Chinatown | PIK, Glodok |
| 5 | Jakarta Timur | Manufacturing industry | Pulogadung |

The Jakarta Pusat chapter additionally reveals a **congestion overlay**: geohash cells tracing the Sudirman corridor, styled red to signal *macet* (heavy traffic). It is static sample data in the POC, with a live-feed upgrade path in §10.

---

## 2. Architectural principle: static-first, server-optional

The reverse-engineering of the reference site revealed the core insight worth carrying forward: **a storytelling WebGIS needs almost no backend.** The reference is a config-driven SPA whose "backend" is static TopoJSON/GeoJSON files plus a tile CDN, with an *optional* ArcGIS REST path for heavier layers.

This project adopts the same stance, modernized:

- **Static-first** — the entire experience (HTML, JS, geodata) ships as static assets from a CDN. No app server to run, scale, or secure for the POC.
- **Server-optional** — a dynamic tier (vector-tile server, feature API) is defined but *deferred*. The architecture names exactly when and how to graduate to it (§6, §10), so the POC stays lean without painting us into a corner.

This is the single most important design decision and it drives everything below.

---

## 3. System context

```mermaid
flowchart LR
    user([Visitor / browser])
    app[Static SPA<br/>Next.js export]
    cdn{{Vercel Edge CDN}}
    basemap[(Basemap raster/vector tiles<br/>MapLibre demo / OSM / MapTiler)]
    gh[(GitHub repo)]
    ga[Analytics<br/>optional]

    user -->|HTTPS| cdn
    cdn -->|HTML + JS + GeoJSON| app
    app -->|XYZ tile requests| basemap
    gh -->|git push → build| cdn
    app -.->|page views| ga
```

Everything the visitor touches is served from the Vercel CDN except basemap tiles, which come from a tile provider. There is no origin server in the request path.

---

## 4. Container / component architecture

```mermaid
flowchart TB
    subgraph browser[Browser runtime]
        direction TB
        story[StoryApp<br/>state: activeChapter, mode, reducedMotion]
        scroller[Scroller<br/>Scrollama wrapper]
        chapter[Chapter × N<br/>title + body + image]
        map[MapCanvas<br/>MapLibre GL instance]
        explore[ExplorePanel<br/>layer toggles · free pan/zoom]
        story --> scroller
        scroller --> chapter
        story --> map
        story --> explore
        explore --> map
    end

    subgraph config[Build-time config + data]
        chapters[chapters.ts<br/>narrative model]
        views[mapViews.ts<br/>camera presets]
        layers[mapLayers.ts<br/>paint/filter helpers]
        districts[(jakarta-districts.geojson)]
        landmarks[(landmarks.geojson)]
        congestion[(congestion.geojson<br/>geohash cells)]
        images[/images/*.jpg/]
    end

    chapters --> story
    views --> story
    layers --> map
    districts --> map
    landmarks --> map
    congestion --> map
    images --> chapter
```

**Separation of concerns (the reference site's best idea, kept):** the narrative is *data*, not code. `chapters.ts` + `mapViews.ts` declare what each chapter says, which image it shows, and where the camera goes. Components are generic; the story is config. Re-ordering or editing chapters never touches component code.

### Component responsibilities

| Component | Responsibility | Key interface |
|-----------|----------------|---------------|
| `StoryApp` | Hold `activeChapter` + `mode` (`story`/`explore`) state, detect `prefers-reduced-motion`, wire scroll → map | `activeDistrictId`, `view`, `mode`, `showCongestion` → `MapCanvas` |
| `Scroller` | Fire `onChapter(index)` as panels enter viewport (Scrollama) | `{chapters, onChapter}` |
| `Chapter` | Render one narrative panel (title, body, image) | `{chapter}` |
| `MapCanvas` | Own the MapLibre map; highlight active district, hover-highlight, fly camera, show landmarks + congestion; enable interaction in explore mode | `{activeDistrictId, view, mode, showCongestion, reducedMotion}` |
| `ExplorePanel` | Render layer toggles + hint shown in explore mode | `{layers, onToggle}` |
| `lib/mapLayers.ts` | Pure styling helpers (testable without WebGL) | `districtFillPaint`, `landmarkFilter`, `cameraMove`, `congestionPaint` |

---

## 5. Frontend architecture

### 5.1 The scroll → story → map pipeline

```mermaid
sequenceDiagram
    participant U as Visitor
    participant S as Scroller (Scrollama)
    participant A as StoryApp
    participant M as MapCanvas (MapLibre)

    U->>S: scrolls panel into view
    S->>A: onChapter(index)
    A->>A: setActiveChapter(index)
    A->>M: props { activeDistrictId, view }
    M->>M: cameraMove() → flyTo / jumpTo(view)
    M->>M: setPaintProperty (highlight active, dim others)
    M->>M: setFilter (landmarks of active district)
```

- **Rendering model:** Next.js static export (`output: 'export'`). Pages are prerendered HTML; the story runs client-side. No SSR/serverless at runtime.
- **Map as a sticky background:** the map container is `position: sticky; top: 0; height: 100vh`; narrative panels scroll over it. One persistent MapLibre instance — never re-created per chapter.
- **State:** a single source of truth (`activeChapter` index in `StoryApp`). Derived values (district id, camera view) flow down as props. No global store needed at POC scale.
- **Camera choreography:** each chapter maps to a named view preset (center + zoom), mirroring the reference's `views: {default, arctic, lancaster}`. The map animates between presets; it does not compute geometry centroids at runtime (avoids drift toward offshore polygons — see §9).

### 5.2 Library choices

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js 14 (static export) | Brief mandates Vercel; first-class there; static export = zero server cost |
| Map engine | **MapLibre GL JS 4** | Open-source, no access token, vector-capable, data-driven styling, smooth `flyTo` |
| Scroll trigger | **Scrollama 3** | IntersectionObserver-based, the de-facto scrollytelling library, tiny |
| Language | TypeScript | Typed chapter/geo models catch config errors at build |
| Test | Vitest + Testing Library + jsdom | Fast; unit-tests the pure logic (paint, filter, scroll math) |

### 5.3 Interactions

- **Hover-to-highlight (district polygons):** on `mousemove` over the district fill layer, MapLibre `setFeatureState({hover:true})` thickens that polygon's outline and lifts its fill opacity; a lightweight tooltip follows the cursor showing the district `name`. `mouseleave` clears the state. This uses feature-state, not a layer rebuild, so it is cheap and does not fight the active-chapter highlight. Hover is a pointer affordance; keyboard/touch users rely on the scripted highlight and the explore toggles, so no information is hover-only.
- **Explore mode (after the story):** the outro chapter offers an "Explore" entry. `StoryApp.mode` flips to `explore`: the map's pan/zoom/scroll-zoom handlers are enabled, all five districts render at base opacity, all landmarks show, and an `ExplorePanel` exposes toggles (district labels, landmarks, Sudirman congestion). This is the reference site's third mode (free *layers* exploration) folded into the end of the linear story — scripted first, open-ended after.

```mermaid
stateDiagram-v2
    [*] --> Story
    Story --> Story: scroll (chapter changes, camera locked)
    Story --> Explore: click "Explore" on outro
    Explore --> Story: click "Back to story"
    Explore --> Explore: pan / zoom / toggle layers
```

---

## 6. Backend and API strategy

The brief asks to focus on "backend integration/APIs." Here is the honest, tiered answer.

### 6.1 Tier 0 — what the POC actually uses (no backend)

```mermaid
flowchart LR
    app[SPA] -->|GET /data/*.geojson| cdn{{Vercel CDN}}
    app -->|GET XYZ tiles| tiles[(Tile provider)]
```

- **Data "API" = static files over CDN.** `jakarta-districts.geojson` and `landmarks.geojson` are fetched as plain HTTP GETs. The CDN is the API gateway; HTTP caching + immutable asset hashing is the whole performance story.
- **Basemap API = XYZ tile endpoint** of a tile provider (MapLibre demo tiles for dev; MapTiler/other free-tier with a key for production polish). This is the only external service call.
- **Analytics (optional)** = a client beacon (Plausible/GA4).

This is sufficient because the data is small, read-only, and changes rarely — exactly the reference site's profile.

### 6.2 Tier 1 — when to add a dynamic backend (deferred, designed)

Graduate a layer from static to dynamic when **any** of these thresholds is crossed:

| Trigger | Dynamic solution |
|---------|------------------|
| GeoJSON per layer > ~1–2 MB, or many layers | **Vector tiles** (PMTiles on the CDN — still serverless — or a tile server: Martin / pg_tileserv over PostGIS) |
| Need server-side spatial queries / filtering by bbox or attribute | **Feature API**: Next.js Route Handlers (serverless) or an external **ArcGIS REST / OGC API – Features** endpoint (the reference site's optional path) |
| Data edited by non-developers | **Headless CMS** (Sanity/Strapi) feeding the chapter config + a build hook |
| Live/near-real-time layers (e.g., flooding, traffic) | Polled REST/GeoServices or WebSocket feed into a GL source |

```mermaid
flowchart LR
    app[SPA] -->|vector tiles| pmtiles[(PMTiles on CDN)]
    app -->|/api/features?bbox=| fn[Serverless Route Handler]
    fn --> pg[(PostGIS)]
    app -->|REST f=json| arcgis[(ArcGIS / OGC API Features)]
```

The key architectural property: **the frontend talks to a GL `source` abstraction, so swapping a GeoJSON source for a vector-tile or feature-API source is a config change, not a rewrite.** That is why static-first does not become technical debt.

---

## 7. Data architecture

### 7.1 Sourcing and pipeline

```mermaid
flowchart LR
    gadm[(GADM 4.1<br/>IDN ADM2)] --> fetch[scripts/build-districts.mjs]
    fetch -->|filter NAME_1 = Jakarta Raya| filt[keep 5 kota · drop Kepulauan Seribu]
    filt -->|mapshaper simplify| simp[~≤300 KB]
    simp --> out[(public/data/jakarta-districts.geojson)]
    hand[hand-authored landmarks] --> lm[(public/data/landmarks.geojson)]
    line[Sudirman centerline] --> gh[scripts/build-congestion.mjs<br/>ngeohash encode]
    gh -->|precision-7 cells| cong[(public/data/congestion.geojson)]
```

- **Boundaries:** **GADM 4.1** Indonesia level-2 (`gadm41_IDN_2`), filtered where `NAME_1 = "Jakarta Raya"` and `NAME_2` is one of the five kota (Kepulauan Seribu excluded), simplified with **mapshaper**. Build-time script, committed output. GADM properties `GID_2`/`NAME_2` are mapped to our canonical `{id, name}`.
  - **License caveat:** GADM is free for academic/non-commercial use but its license restricts redistribution and commercial use. For this assessment (non-commercial POC) we ship a simplified derivative with attribution in `CREDITS.md`; the ADR (§11) notes geoBoundaries (CC BY) or BPS/Jakarta Satu as the drop-in open-licensed source for a public/commercial build.
- **Landmarks:** small, hand-authored GeoJSON points — fast to iterate for a POC.
- **Congestion (Sudirman):** `scripts/build-congestion.mjs` samples the Jalan Sudirman centerline (Bundaran HI → Semanggi), encodes each sample to a **geohash (precision 7, ~150 m cells)** with **ngeohash**, dedupes, and emits one square polygon per cell (from the geohash bounds) tagged `status: "macet"`. Static sample data for the POC.
- **Images:** one CC-licensed / public-domain photo per district (Wikimedia Commons), attributions in `public/images/CREDITS.md`.

### 7.2 Schemas

`jakarta-districts.geojson` — `FeatureCollection`:
```jsonc
{ "type": "Feature",
  "properties": { "id": "jaksel", "name": "Jakarta Selatan" },
  "geometry": { "type": "MultiPolygon", "coordinates": [...] } }
```

`landmarks.geojson` — `FeatureCollection`:
```jsonc
{ "type": "Feature",
  "properties": { "district": "jaksel", "name": "Blok M" },
  "geometry": { "type": "Point", "coordinates": [106.7983, -6.2446] } }
```

`congestion.geojson` — `FeatureCollection` (one polygon per geohash cell):
```jsonc
{ "type": "Feature",
  "properties": { "geohash": "qqgux9k", "status": "macet", "corridor": "Sudirman" },
  "geometry": { "type": "Polygon", "coordinates": [[ /* geohash cell bounds */ ]] } }
```

### 7.3 Projection / CRS strategy

- **Storage:** WGS84 (EPSG:4326) lon/lat — the GeoJSON standard.
- **Render:** Web Mercator (EPSG:3857), MapLibre default.
- **Deliberate contrast with the reference:** Lancaster Sound defines a custom **polar stereographic** projection (EPSG:5937) via Proj4, because near the pole Mercator is unusable. **Jakarta sits on the equator (~6°S), where Mercator distortion is negligible — so we intentionally drop the custom-projection machinery.** Knowing *when not* to add complexity is part of the design.

---

## 8. Deployment and delivery

```mermaid
flowchart LR
    dev[Local dev] -->|git push| gh[(GitHub<br/>feature branch → main)]
    gh -->|Vercel Git integration| build[Vercel build<br/>next build → out/]
    build --> edge{{Vercel Edge CDN}}
    edge --> user([Visitors])
    gh -.->|invite| cat[catalyzecomms]
```

- **CI/CD:** GitHub → Vercel Git integration. Every push builds `next build` (static export to `out/`) and deploys; PRs get preview URLs.
- **Hosting:** static assets on Vercel's edge CDN. No serverless functions at POC (would be added only for Tier-1 feature APIs).
- **Caching:** hashed immutable JS/CSS assets; GeoJSON served with cache headers. Basemap tiles cached by the provider + browser.
- **Submission:** repo on GitHub (invite `catalyzecomms`), live URL on Vercel, both emailed by 8 Nov 2026.

---

## 9. Cross-cutting concerns

| Concern | Approach |
|---------|----------|
| **Accessibility — motion** | Honor `prefers-reduced-motion`: camera uses `jumpTo` instead of `flyTo`; `cameraMove()` encapsulates this |
| **Accessibility — content** | Each chapter image has meaningful `alt`; narrative is real DOM text (screen-reader + SEO friendly), not baked into images (an improvement over the reference's PNG-text scenes) |
| **Mobile** | Sticky map stays visible; panels readable at ≤480px; touch scroll drives Scrollama; hover has no touch equivalent, so no data is hover-only (explore toggles + scripted highlight cover it) |
| **Performance** | One map instance; simplified geometry; data-driven paint over layer churn; small GeoJSON; lazy image loading |
| **Resilience** | GeoJSON fetch wrapped in try/catch — basemap still renders on failure, no crash |
| **Rapid scroll** | `MapCanvas` keeps a latest-view ref so only the most recent chapter's camera move applies (no `flyTo` queue lag) |
| **SEO** | Static prerendered HTML with real narrative text + metadata |
| **Analytics** | Optional privacy-friendly beacon (Plausible) or GA4 |
| **Security** | No secrets in client beyond a domain-restricted tile key; static hosting shrinks attack surface |

---

## 10. Evolution roadmap (POC → production)

```mermaid
flowchart LR
    poc[POC<br/>static GeoJSON<br/>5 districts] --> v1[v1<br/>vector tiles · PMTiles<br/>CMS-driven chapters]
    v1 --> v2[v2<br/>feature API · PostGIS<br/>multi-language UI]
    v2 --> v3[v3<br/>live layers<br/>user-selectable datasets]
```

1. **POC (this build):** static data, scripted narrative, five districts, hover-highlight, static Sudirman congestion overlay, explore mode.
2. **v1:** move geometry to PMTiles/vector tiles; narrative + images managed in a headless CMS with a Vercel deploy hook; EN/ID language toggle.
3. **v2:** PostGIS + serverless feature API for attribute/bbox queries; richer explore-mode layer catalog.
4. **v3:** **live traffic feed** replacing the static congestion sample (poll a provider / open data into the geohash layer, recoloring cells by real-time speed); user-chosen datasets; bookmarkable map state in the URL (the reference encodes `#!/home?view=lat|lng|zoom` — worth keeping).

---

## 11. Key technical decisions (ADR summary)

| Decision | Chosen | Alternatives considered | Rationale |
|----------|--------|-------------------------|-----------|
| Map engine | MapLibre GL | Mapbox GL (token/cost), Leaflet (raster, like reference), ArcGIS JS (heavy/licensed) | Open, free, vector, smooth camera; no vendor lock-in |
| Backend | Static-first | Always-on server, serverless-first | Data is small & read-only; matches reference; cheapest; defer servers until a trigger (§6.2) |
| Data format | GeoJSON (POC) | TopoJSON (reference), Shapefile, vector tiles | Simplest to author/debug small data; upgrade path to PMTiles defined |
| Boundary source | **GADM 4.1** (ADM2) | geoBoundaries (CC BY), BPS, Jakarta Satu, OSM | User choice; complete IDN ADM2. Caveat: GADM restricts redistribution/commercial use (§7.1) — swap to geoBoundaries for a public/commercial build |
| Congestion encoding | **Geohash cells** (precision 7) | GPS polyline, H3 hexagons, segment IDs | Compact, grid-aligned, trivially colorable; cells map cleanly to a GL fill layer; ngeohash is tiny |
| Projection | Web Mercator | Custom polar stereographic (reference) | Equatorial location makes custom CRS unnecessary complexity |
| Framework | Next.js static export | Plain Vite/React, Astro | Brief mandates Vercel; static export keeps it serverless; easy Tier-1 serverless later |
| Narrative | Config-driven data | Hardcoded in components | Editable without code changes; the reference's strongest pattern |

---

## 12. What the reference site is, and how this differs

**`lancastersound.wwf.ca` (reverse-engineered):** a ~2016 RequireJS SPA using **Leaflet 0.7.7 + Proj4Leaflet** on a custom Arctic projection (EPSG:5937), a **Mapbox classic raster** basemap, and **static TopoJSON/GeoJSON** data (with an optional ArcGIS REST path). Three modes — scripted *story*, *gallery* of clustered media, free-explore *layers* — all driven by declarative JSON config. Narrative scenes are largely pre-rendered PNGs.

**This project keeps** the config-driven narrative model, named camera views, static-first data, and the story→explore arc. **It modernizes** the stack (MapLibre + Next.js + Scrollama over RequireJS + Leaflet), uses **real DOM text** for narrative (accessibility/SEO) instead of PNG scenes, and **drops the custom projection** because Jakarta is equatorial — demonstrating judgement about where complexity is and isn't warranted.

---

## 13. Build timeline (now → deadline 8 Nov 2026)

Six working days, Tue 3 Nov → Sun 8 Nov. Each day ends with something committed and (from Day 5) deployed, so there is always a submittable state.

```mermaid
gantt
    dateFormat YYYY-MM-DD
    axisFormat %a %d
    title Jakarta WebGIS — POC to 8 Nov 2026
    section Setup & data
    Scaffold + GADM + landmarks + congestion   :d1, 2026-11-03, 1d
    section Map core
    Chapter/camera model + MapCanvas base       :d2, 2026-11-04, 1d
    section Interactions & UI
    Hover + congestion + Scroller/Chapter UI     :d3, 2026-11-05, 1d
    section Explore & assembly
    Explore mode + StoryApp + styling            :d4, 2026-11-06, 1d
    section Content & deploy
    Images + README + Vercel deploy              :d5, 2026-11-07, 1d
    section QA & submit
    QA + buffer + submit to catalyzecomms        :d6, 2026-11-08, 1d
```

| Day | Date | Focus | Deliverable |
|-----|------|-------|-------------|
| 1 | Tue 3 Nov | Scaffold (Next.js static export, Vitest); data pipeline — GADM → 5 kota, landmarks, Sudirman congestion geohash | Repo builds; three GeoJSON files validated by tests |
| 2 | Wed 4 Nov | Chapter model + camera presets; MapCanvas base — map, district fill/line, active-district highlight, `flyTo` | Map renders; scripted highlight + camera works |
| 3 | Thu 5 Nov | Hover-to-highlight (feature-state + tooltip); congestion layer (red cells); landmark markers; Scroller + Chapter panels | Scroll advances chapters; hover + congestion visible |
| 4 | Fri 6 Nov | Explore mode + ExplorePanel toggles; assemble StoryApp (story↔explore); layout/styling | Full story + explore flow runs end to end |
| 5 | Sat 7 Nov | District images + credits; README (architecture, data strategy, timeline); first Vercel deploy | Live preview URL; README complete |
| 6 | Sun 8 Nov | QA (mobile, reduced-motion, rapid scroll, data-failure); bug buffer; final deploy; invite `catalyzecomms`; email links | **Submitted by EoD** |

**Assumptions:** solo build, roughly a focused half-to-full day each. Days 5–6 hold the buffer; if earlier days slip, congestion/explore are the first polish items to trim, not the core story.
