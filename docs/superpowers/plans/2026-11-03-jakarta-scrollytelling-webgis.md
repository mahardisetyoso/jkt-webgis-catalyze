# Jakarta Scrollytelling WebGIS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a linear scroll-driven WebGIS story that walks the viewer through the five municipalities (kota administrasi) of DKI Jakarta, each with a short narrative and a representative image, as a Vercel-deployable proof-of-concept for the Catalyze WebGIS case study.

**Architecture:** A statically-exported Next.js app. A single full-viewport MapLibre GL map sits sticky behind a column of scrolling narrative panels. Scrollama fires chapter-change events as each panel enters view; the active chapter drives a `flyTo` camera move, highlights that district's boundary polygon (dimming the others), and reveals that district's landmark markers. The story also adds a hover-to-highlight affordance on polygons, a static Sudirman traffic-congestion overlay (red geohash cells), and a free explore mode after the outro. All geodata (district boundaries, landmark points, congestion cells) ships as static GeoJSON from the CDN — there is no application server, mirroring the reference site's config-driven, static-data approach.

**Tech Stack:** Next.js 14 (App Router, `output: 'export'`), TypeScript, MapLibre GL JS 4, Scrollama 3, ngeohash (geohash encode for the congestion layer), Vitest + @testing-library/react + jsdom, mapshaper (data prep CLI). Deploy: Vercel. Repo: GitHub.

**Spec:** [`docs/architecture.md`](../../architecture.md) — the end-to-end architecture document. Further sources: the case study brief (`C:\Users\hardy\Downloads\WebGIS Development – Case Study Assessment.pdf`) and the reverse-engineering of `lancastersound.wwf.ca` captured earlier in this session (config-driven static SPA: map engine + Proj4 custom CRS + static TopoJSON/GeoJSON + named camera views per narrative chapter). The chosen direction is **Option A — linear scrollytelling**, applied to Jakarta's five municipalities with the narratives below.

## Global Constraints

- Map engine: **MapLibre GL JS 4.x** (open source, no access token) — not Mapbox GL, not Leaflet.
- Projection: **Web Mercator (EPSG:3857)**, MapLibre default. Jakarta sits on the equator, so the Arctic polar-stereographic trick from the reference site is deliberately *not* needed; the README must state this reasoning (shows cartographic judgement).
- Build must produce a **fully static export** (`output: 'export'`, no server runtime) so it deploys to Vercel as static assets.
- Geodata CRS: **WGS84 (EPSG:4326)** lon/lat in all GeoJSON files.
- Boundary source: **GADM 4.1** Indonesia ADM2 (`gadm41_IDN_2`), filtered where `NAME_1 = "Jakarta Raya"`. GADM license restricts redistribution/commercial use, so ship only a simplified derivative with attribution; this is acceptable for a non-commercial assessment (note geoBoundaries/BPS as the open-licensed swap for a public build).
- Congestion layer: static sample data — geohash cells (precision 7) along the Jalan Sudirman corridor, `status: "macet"`, styled red. Shown on the `jakpus` chapter and toggleable in explore mode.
- Interactions: hover over a district polygon highlights it (feature-state) with a name tooltip; an **explore mode** after the outro enables free pan/zoom and layer toggles. No data is hover-only (touch/keyboard reach it via explore toggles + scripted highlight).
- The five municipalities, exact canonical ids and display names:
  - `jakpus` — "Jakarta Pusat"
  - `jakbar` — "Jakarta Barat"
  - `jaksel` — "Jakarta Selatan"
  - `jakut` — "Jakarta Utara"
  - `jaktim` — "Jakarta Timur"
  - (Exclude Kabupaten Administrasi Kepulauan Seribu — only the five mainland kota.)
- Narrative copy is in **Bahasa Indonesia**, kept short ("narasi sederhana"). Exact copy is pinned in Task 4.
- All third-party images must be **CC-licensed (or public domain)** with attribution recorded in `public/images/CREDITS.md`. No images that cannot be redistributed.
- Jakarta mainland bounding box for validation: lon `106.68 … 107.01`, lat `-6.38 … -6.08`.
- Accessibility: honor `prefers-reduced-motion` (see Review Focus).

## Review Focus

jsdom has no layout engine, no WebGL, and no scroll, so the layout/map/scroll items below are pinned to the **manual verification checklist in Task 8 Step 4**, not to unit tests; the two that reduce to pure logic get real unit tests.

- **`prefers-reduced-motion: reduce`:** camera transitions must become instant (`jumpTo`) instead of animated `flyTo`. → **unit test in Task 5** (`cameraMove(true) === 'jumpTo'`), and `StoryApp` must read the media query (verified in Task 8).
- **MultiPolygon / offshore geometry:** Jakarta Utara includes coastal/reclaimed polygons; the per-district camera center must use a pinned view preset, not a naive centroid that could drift seaward. → **unit test in Task 4** (views are explicit presets, validated in-bbox).
- **Mobile / narrow viewport (≤480px):** the sticky map must stay visible with narrative panels scrolling over it; chapters must remain readable. → **manual check, Task 8 Step 4**.
- **Rapid scrolling past several chapters:** only the latest active chapter's camera move should take effect; intermediate `flyTo` calls must not queue up and lag (ref-based latest-wins in `MapCanvas`, Task 5). → **manual check, Task 8 Step 4**.
- **GeoJSON fetch failure / slow load:** if a data file fails to load, the basemap must still render and the app must not throw; a console `warn` is acceptable for the POC (try/catch in `MapCanvas`, Task 5). → **manual check, Task 8 Step 4**.
- **Mode transition (story ↔ explore):** entering explore must enable pan/zoom/scroll-zoom and show all layers; returning to story must disable free interaction and re-lock the camera to chapters — a toggle bug leaves the map frozen in explore or pannable during the story. The `mapInteractive(mode)` helper is unit-tested (Task 5); the end-to-end toggle is a **manual check, Task 8 Step 4**.

---

### Task 1: Project scaffold, tooling, and static build

**Files:**
- Create: `package.json`, `next.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `vitest.setup.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore`, `.nvmrc`
- Test: `tests/build.test.ts`

**Interfaces:**
- Produces: a buildable Next.js static-export app. `npm run build` emits `out/`. `npm test` runs Vitest. App Router page at `app/page.tsx` renders a placeholder `<main>`.

- [ ] **Step 1: Write the failing test** — `tests/build.test.ts`: assert `next.config.mjs` default export has `output === 'export'`; assert `package.json` scripts include `build`, `dev`, and `test`.
- [ ] **Step 2: Run test to verify it fails** — Run: `npm test`. Expected: FAIL (files/config absent).
- [ ] **Step 3: Scaffold the app.** Create Next.js 14 App Router project in-place with TypeScript. Set `next.config.mjs` to `{ output: 'export', images: { unoptimized: true } }`. Add deps: `maplibre-gl@^4`, `scrollama@^3`; devDeps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `ngeohash` (build-time geohash encode), `@types/*`. Configure `vitest.config.ts` with `environment: 'jsdom'` and `vitest.setup.ts` importing `@testing-library/jest-dom`. `app/page.tsx` renders a placeholder `<main>`.
- [ ] **Step 4: Run tests + build.** Run: `npm test && npm run build`. Expected: test PASS; `out/` produced.
- [ ] **Step 5: Commit** — `chore: scaffold Next.js static-export app with Vitest`.

---

### Task 2: Jakarta district boundary data

**Files:**
- Create: `scripts/build-districts.mjs`, `public/data/jakarta-districts.geojson`
- Test: `tests/data.districts.test.ts`

**Interfaces:**
- Produces: `public/data/jakarta-districts.geojson` — a `FeatureCollection` of 5 features, each with `properties.id` (one of the five canonical ids) and `properties.name` (display name), geometry `Polygon` or `MultiPolygon`, WGS84.

- [ ] **Step 1: Write the failing test** — `tests/data.districts.test.ts`: load the file; assert `type === 'FeatureCollection'`; assert exactly 5 features; assert the set of `properties.id` equals `{jakpus, jakbar, jaksel, jakut, jaktim}`; assert every feature geometry type is `Polygon` or `MultiPolygon`; assert every coordinate lies within the Jakarta bbox from Global Constraints.
- [ ] **Step 2: Run test to verify it fails** — Run: `npm test -- data.districts`. Expected: FAIL (file missing).
- [ ] **Step 3: Produce the data.** `scripts/build-districts.mjs`: read **GADM 4.1** Indonesia ADM2 (`gadm41_IDN_2.json`, from `https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_IDN_2.json.zip`), keep features where `NAME_1 === "Jakarta Raya"` and `NAME_2` is one of the five kota (exclude "Kepulauan Seribu"), map `NAME_2`/`GID_2` to `{id, name}` per the Global Constraints table, simplify with mapshaper to ≤ ~300 KB total, write the FeatureCollection. Record the GADM source + license caveat in the README/CREDITS.
- [ ] **Step 4: Run test to verify it passes** — Run: `npm test -- data.districts`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add Jakarta 5-municipality boundary GeoJSON`.

---

### Task 3: Landmark points data

**Files:**
- Create: `public/data/landmarks.geojson`
- Test: `tests/data.landmarks.test.ts`

**Interfaces:**
- Produces: `public/data/landmarks.geojson` — `FeatureCollection` of `Point` features, each `properties = { district: <canonical id>, name: string }`.

Seed landmarks (lon, lat — refine to taste, must stay in-bbox):
- `jakpus`: Sudirman `106.8206,-6.2088`; SCBD `106.8089,-6.2241`
- `jakbar`: Trisakti `106.7886,-6.1686`; Untar `106.7866,-6.1690`; Ciputra (Grogol) `106.7906,-6.1665`; Tanjung Duren `106.7906,-6.1800`
- `jaksel`: Blok M `106.7983,-6.2446`; Kemang `106.8140,-6.2600`
- `jakut`: PIK `106.7400,-6.1100`; Pecinan/Glodok `106.8136,-6.1480`
- `jaktim`: Pulogadung (JIEP) `106.9070,-6.1850`

- [ ] **Step 1: Write the failing test** — `tests/data.landmarks.test.ts`: assert every feature is a `Point`; assert `properties.district` is one of the five ids; assert each of the five districts has ≥1 landmark; assert every point lies within the Jakarta bbox.
- [ ] **Step 2: Run test to verify it fails** — Run: `npm test -- data.landmarks`. Expected: FAIL.
- [ ] **Step 3: Author the file** from the seed list above.
- [ ] **Step 4: Run test to verify it passes** — Run: `npm test -- data.landmarks`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add Jakarta landmark points GeoJSON`.

---

### Task 3b: Sudirman congestion geohash data

**Files:**
- Create: `scripts/build-congestion.mjs`, `public/data/congestion.geojson`
- Test: `tests/data.congestion.test.ts`

**Interfaces:**
- Produces: `public/data/congestion.geojson` — `FeatureCollection` of `Polygon` features (one per geohash cell), each `properties = { geohash: string, status: "macet", corridor: "Sudirman" }`.

Approach: `scripts/build-congestion.mjs` samples the Jalan Sudirman centerline (Bundaran HI `106.8229,-6.1944` → Semanggi `106.8114,-6.2206`) at a fixed interval, encodes each sample to a geohash with **ngeohash** (`ngeohash.encode(lat, lon, 7)`), dedupes the geohashes, and for each emits a square polygon built from `ngeohash.decode_bbox(gh)` (returns `[minLat, minLon, maxLat, maxLon]`) with `status: "macet"`.

- [ ] **Step 1: Write the failing test** — `tests/data.congestion.test.ts`: assert every feature is a `Polygon`; assert every `properties.status === "macet"` and `properties.geohash` is a 7-char string; assert geohashes are unique; assert every cell centroid lies within the Jakarta bbox and near the Sudirman corridor (lon `106.80…106.83`, lat `-6.22…-6.19`).
- [ ] **Step 2: Run test to verify it fails** — Run: `npm test -- data.congestion`. Expected: FAIL.
- [ ] **Step 3: Implement** `scripts/build-congestion.mjs` and generate the file.
- [ ] **Step 4: Run test to verify it passes** — Run: `npm test -- data.congestion`. Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add Sudirman congestion geohash GeoJSON`.

---

### Task 4: Chapter model, camera views, and scroll logic

**Files:**
- Create: `lib/chapters.ts`, `lib/mapViews.ts`, `lib/useScrollChapter.ts`
- Test: `tests/chapters.test.ts`, `tests/useScrollChapter.test.ts`

**Interfaces:**
- Produces:
  - `type MapView = { center: [number, number]; zoom: number }`
  - `type Chapter = { id: string; districtId: string | null; title: string; body: string; image: string | null; view: MapView; congestion?: boolean }`
  - `export const chapters: Chapter[]` — order: `intro`, `jakpus`, `jakbar`, `jaksel`, `jakut`, `jaktim`, `outro`.
  - `export const mapViews: Record<string, MapView>` keyed by district id plus `overview`.
  - `export function activeChapterIndex(progress: number, count: number): number` — maps scroll progress to an index (used/validated here; the component may instead use Scrollama callbacks).
- Consumes: canonical ids from Global Constraints.

Exact chapter copy (use verbatim):
- `intro` — title "Jakarta — Lima Wajah Satu Kota", body "Jelajahi lima kota administrasi DKI Jakarta, masing-masing dengan karakter dan denyutnya sendiri. Scroll untuk memulai.", view `overview`, image `null`.
- `jakpus` — title "Jakarta Pusat — Jantung Bisnis", body "Pusat bisnis ibu kota. Menara pencakar langit berjajar di koridor Sudirman dan kawasan SCBD — yang juga terkenal dengan kemacetannya.", image `/images/jakpus-sudirman.jpg`, `congestion: true`.
- `jakbar` — title "Jakarta Barat — Kampus dan Kuliner", body "Rumah bagi kampus ternama — Trisakti, Untar, dan Ciputra — serta surga kuliner di Tanjung Duren.", image `/images/jakbar-untar.jpg`.
- `jaksel` — title "Jakarta Selatan — Pop Culture & Hiburan", body "Episentrum budaya pop dan hiburan anak muda, dari legenda Blok M hingga kafe-kafe Kemang.", image `/images/jaksel-blokm.jpg`.
- `jakut` — title "Jakarta Utara — Perdagangan & Pecinan", body "Gerbang perdagangan dan pelabuhan, dari kawasan modern PIK hingga pecinan bersejarah.", image `/images/jakut-pik.jpg`.
- `jaktim` — title "Jakarta Timur — Industri Manufaktur", body "Basis industri manufaktur ibu kota, dengan kawasan Pulogadung sebagai motornya.", image `/images/jaktim-pulogadung.jpg`.
- `outro` — title "Lima kota, satu Jakarta.", body "Satu proof-of-concept WebGIS storytelling. Lihat README untuk arsitektur, strategi data, dan timeline.", view `overview`, image `null`.

Seed camera views (center lon/lat, zoom — must be in-bbox):
- `overview` `106.84,-6.21` z `10.2` · `jakpus` `106.835,-6.19` z `12.4` · `jakbar` `106.76,-6.16` z `11.8` · `jaksel` `106.81,-6.28` z `11.9` · `jakut` `106.82,-6.13` z `11.2` · `jaktim` `106.90,-6.25` z `11.4`

- [ ] **Step 1: Write the failing tests** — `tests/chapters.test.ts`: assert `chapters` length 7 and id order as above; assert each non-null `districtId` is a canonical id; assert each district chapter's `view` exists in `mapViews`; assert every `view.center` is in-bbox and `zoom` in `[9, 16]`; assert the `jakpus` chapter has `congestion === true` and no other chapter sets it. `tests/useScrollChapter.test.ts`: `activeChapterIndex(0, 7) === 0`, `activeChapterIndex(1, 7) === 6`, and it clamps out-of-range progress.
- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- chapters useScrollChapter`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/chapters.ts`, `lib/mapViews.ts`, and `activeChapterIndex` + the `useScrollChapter` hook in `lib/useScrollChapter.ts`.
- [ ] **Step 4: Run tests to verify they pass** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add chapter model, camera views, and scroll logic`.

---

### Task 5: MapCanvas — MapLibre render, highlight, and camera

**Files:**
- Create: `components/MapCanvas.tsx`, `lib/mapLayers.ts`
- Test: `tests/mapLayers.test.ts`

**Interfaces:**
- Consumes: `Chapter`, `MapView` (Task 4); `jakarta-districts.geojson`, `landmarks.geojson` (Tasks 2–3); `congestion.geojson` (Task 3b).
- Produces:
  - `MapCanvas` React component, props `{ activeDistrictId: string | null; view: MapView; mode: 'story' | 'explore'; showCongestion: boolean; reducedMotion: boolean }`. Loads the three GeoJSON sources; adds a district fill+line layer, a landmark circle layer, and a congestion fill layer; on prop change moves the camera, restyles layers for the active district, toggles the congestion layer, and enables/disables map interaction by mode.
  - Pure helpers in `lib/mapLayers.ts`:
    - `districtFillPaint(activeId: string | null, hoverId: string | null): FillPaint` — data-driven `fill-opacity`: active district ~`0.55`, hovered ~`0.35`, others ~`0.08`.
    - `landmarkFilter(activeId: string | null): FilterSpecification` — show only the active district's landmarks (`['==', ['get','district'], activeId]`), or none when `null`.
    - `congestionPaint(): FillPaint` — constant red fill for `status === "macet"` cells (`fill-color` `#e53935`, `fill-opacity` ~`0.5`).
    - `cameraMove(reducedMotion: boolean): 'jumpTo' | 'flyTo'`.
    - `mapInteractive(mode: 'story' | 'explore'): boolean` — `true` for `explore`, `false` for `story` (drives `dragPan`/`scrollZoom`/`touchZoomRotate` enable/disable).

Hover: on `mousemove` over the district fill layer, set local `hoverId` state (passed into `districtFillPaint`) and show a name tooltip at the cursor; clear on `mouseleave`. The map-move effect must cancel/ignore stale moves so rapid chapter changes settle on the latest (store the latest view in a ref; only the most recent effect run issues the move). On a GeoJSON load error, catch and `console.warn`, leaving the basemap intact.

- [ ] **Step 1: Write the failing test** — `tests/mapLayers.test.ts`: `districtFillPaint('jaksel', null)` → active opacity for `jaksel`, dim for others; `districtFillPaint(null, 'jakut')` → hover opacity for `jakut`; `landmarkFilter(null)` excludes all, `landmarkFilter('jakpus')` matches only `jakpus`; `congestionPaint()` is a red fill; `cameraMove(true) === 'jumpTo'`, `cameraMove(false) === 'flyTo'`; `mapInteractive('explore') === true`, `mapInteractive('story') === false`.
- [ ] **Step 2: Run test to verify it fails** — Run: `npm test -- mapLayers`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/mapLayers.ts` helpers, then `MapCanvas.tsx` using them (district/landmark/congestion layers, hover tooltip, mode-driven interaction toggle). Use a free MapLibre demo/OpenStreetMap raster or a free vector style as the basemap (record the choice + attribution). Keep all WebGL-dependent code inside the component so the helpers stay unit-testable without a GL context.
- [ ] **Step 4: Run test to verify it passes** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add MapCanvas with highlight, hover, congestion, and mode interaction`.

---

### Task 6: Scroller and Chapter UI

**Files:**
- Create: `components/Scroller.tsx`, `components/Chapter.tsx`
- Test: `tests/Chapter.test.tsx`, `tests/Scroller.test.tsx`

**Interfaces:**
- Consumes: `chapters` (Task 4).
- Produces:
  - `Chapter` component, props `{ chapter: Chapter }` — renders a panel with `<h2>` title, `<p>` body, and (when `image` is set) an `<img>` with meaningful `alt`.
  - `Scroller` component, props `{ chapters: Chapter[]; onChapter(index: number): void }` — wraps Scrollama, renders a `Chapter` per step, calls `onChapter` on step enter.

CSS (in `globals.css`): the map container is `position: sticky; top: 0; height: 100vh`; narrative column sits above it with transparent-to-translucent panels. Must hold at ≤480px width (map stays visible, panel text readable) — covered by the mobile test.

- [ ] **Step 1: Write the failing tests** — `tests/Chapter.test.tsx`: renders title + body text; renders `<img>` with non-empty `alt` when `image` set; renders no `<img>` when `image` is null. `tests/Scroller.test.tsx`: mock `scrollama`, assert `onChapter` is invoked with the step index on step-enter; assert one panel rendered per chapter.
- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- Chapter Scroller`. Expected: FAIL.
- [ ] **Step 3: Implement** both components and the sticky-map CSS.
- [ ] **Step 4: Run tests to verify they pass** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add scrollytelling Scroller and Chapter UI`.

---

### Task 7: District images and credits

**Files:**
- Create: `public/images/jakpus-sudirman.jpg`, `public/images/jakbar-untar.jpg`, `public/images/jaksel-blokm.jpg`, `public/images/jakut-pik.jpg`, `public/images/jaktim-pulogadung.jpg`, `public/images/CREDITS.md`
- Test: `tests/images.test.ts`

**Interfaces:**
- Consumes: the image paths pinned in Task 4's chapters.

- [ ] **Step 1: Write the failing test** — `tests/images.test.ts`: for every chapter with a non-null `image`, assert the file exists on disk under `public`; assert `public/images/CREDITS.md` names each of the five image files.
- [ ] **Step 2: Run test to verify it fails** — Run: `npm test -- images`. Expected: FAIL.
- [ ] **Step 3: Acquire images.** One representative CC-licensed or public-domain photo per district landmark (e.g., Wikimedia Commons), downsized to ~1200px wide, saved at the exact paths above. Record title, author, license, and source URL for each in `CREDITS.md`. If no suitable licensed photo exists for a landmark, substitute a simple captioned illustration and note it.
- [ ] **Step 4: Run test to verify it passes** — Expected: PASS.
- [ ] **Step 5: Commit** — `feat: add district images with attribution`.

---

### Task 8: Assemble the experience

**Files:**
- Modify: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`
- Create: `components/StoryApp.tsx`, `components/ExplorePanel.tsx`
- Test: `tests/StoryApp.test.tsx`, `tests/ExplorePanel.test.tsx`

**Interfaces:**
- Consumes: `MapCanvas` (5), `Scroller`/`Chapter` (6), `chapters`/`mapViews`/`useScrollChapter` (4).
- Produces:
  - `StoryApp` client component that holds `activeChapter` + `mode: 'story' | 'explore'` state, detects `prefers-reduced-motion`, renders `MapCanvas` (sticky) + `Scroller`, and passes the active chapter's `districtId`, `view`, `mode`, and `showCongestion` (= active chapter's `congestion === true`) to `MapCanvas`. The outro chapter shows an "Explore" button that sets `mode='explore'`; in explore mode it renders `ExplorePanel` and a "Back to story" control (sets `mode='story'`).
  - `ExplorePanel` component, props `{ layers: {id: string; label: string; visible: boolean}[]; onToggle(id: string): void }` — renders a toggle per layer (districts labels, landmarks, Sudirman congestion).
  - `app/page.tsx` renders `StoryApp` and a minimal header (title + a link to the README/credits).

- [ ] **Step 1: Write the failing tests** — `tests/StoryApp.test.tsx`: mock `MapCanvas` and `scrollama`; assert `StoryApp` renders all 7 chapter panels; assert firing step-enter for `jaksel` passes `activeDistrictId="jaksel"` to the mocked `MapCanvas`; assert firing step-enter for `jakpus` passes `showCongestion={true}`; assert clicking "Explore" sets `mode="explore"` on `MapCanvas` and renders `ExplorePanel`. `tests/ExplorePanel.test.tsx`: renders one toggle per layer; clicking a toggle calls `onToggle` with that layer id.
- [ ] **Step 2: Run tests to verify they fail** — Run: `npm test -- StoryApp ExplorePanel`. Expected: FAIL.
- [ ] **Step 3: Implement** `ExplorePanel.tsx` and `StoryApp.tsx` (mode state, explore/back controls, prop wiring), wire `app/page.tsx`, finalize layout/header styling.
- [ ] **Step 4: Verify** — Run: `npm test && npm run build`. Expected: tests PASS, `out/` builds. Then `npm run dev` and run the Review Focus manual checklist:
  1. Scrolling advances chapters; the map flies between districts; the active district highlights (others dim); its landmarks + image appear.
  2. **Hover:** hovering a district polygon highlights it and shows its name tooltip; moving away clears it.
  3. **Congestion:** the `jakpus` chapter shows red geohash cells along Sudirman; they are hidden on other chapters.
  4. **Explore mode:** clicking "Explore" on the outro enables pan/zoom, shows all layers, and the panel toggles work; "Back to story" re-locks the camera and disables free panning.
  5. **Mobile:** at ≤480px width, the map stays visible and panel text is readable.
  6. **Rapid scroll:** flick quickly from intro to outro — the camera settles on the final district without visibly queuing every intermediate move.
  7. **Reduced motion:** with OS "reduce motion" on, camera changes are instant (no fly animation).
  8. **Data failure:** temporarily rename `public/data/landmarks.geojson` — the basemap still renders, no crash, a console warning appears. Restore the file.
- [ ] **Step 5: Commit** — `feat: assemble Jakarta scrollytelling experience with explore mode`.

---

### Task 9: README, data strategy, timeline, and deploy config

**Files:**
- Create: `README.md`, `vercel.json` (if needed for static output)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: the whole app; the reverse-engineering findings from this session.

`README.md` must contain the three sections the brief names, plus a short reverse-engineering note (it may summarize `docs/architecture.md` and link to it):
- **System Architecture** — Next.js static export on Vercel + MapLibre GL + Scrollama; data-driven chapter model; sticky-map + scroll panels; hover-highlight, the static Sudirman congestion overlay, and the post-story explore mode; why static (no app server) is the right call here, and the optional dynamic path for scale (vector tiles via a tile server such as Martin/Tegola over PostGIS, or Next.js API routes serving filtered features) — mirroring the reference site's static-first design with an optional ArcGIS REST path.
- **Data Strategy** — boundaries from **GADM 4.1** IDN ADM2 filtered to the five kota and simplified with mapshaper (noting GADM's redistribution/commercial restriction, and geoBoundaries/BPS as the open-licensed swap); landmarks hand-authored as GeoJSON; Sudirman congestion as geohash-cell polygons (ngeohash, precision 7); WGS84 throughout; Web Mercator at render time (with the note that Jakarta's equatorial location is why the reference site's polar-stereographic projection is unnecessary here).
- **Estimated Timeline** — the dated six-day schedule (Tue 3 Nov → Sun 8 Nov) from [`docs/architecture.md`](../../architecture.md) §13: setup+data → map core → interactions+UI → explore+assembly → content+deploy → QA+submit. Production build-out: ~3–4 weeks (real data pipeline + CMS, live traffic feed, multi-language, QA, performance, analytics).
- **Reverse-engineering note** — one short paragraph on what the reference `lancastersound.wwf.ca` is under the hood and how this POC adapts it.

- [ ] **Step 1: Write the README** with the four sections above; link the images `CREDITS.md`.
- [ ] **Step 2: Deploy config** — confirm `output: 'export'` works on Vercel (framework preset Next.js, no serverless needed); add `vercel.json` only if required. Ensure `.gitignore` covers `node_modules`, `.next`, `out`.
- [ ] **Step 3: Verify** — `npm run build` clean; README renders; links resolve.
- [ ] **Step 4: Commit** — `docs: add README with architecture, data strategy, and timeline`.

---

## Notes for the executor

- Work on a feature branch, not `master`. Push to GitHub; deploy the `out/` static export to Vercel. Invite `catalyzecomms` to the repo and email the repo + Vercel links (brief's submission guidelines; deadline 8 Nov 2026).
- Task order with the new work: 1 → 2 → 3 → 3b → 4 → 5 → 6 → 7 → 8 → 9. Tasks 2, 3, 3b (data) are independent of each other and can be done in any order within Day 1.
- i18n (EN/ID toggle) and a live traffic feed (replacing the static congestion sample) are stretch goals that echo the reference site's trilingual mode and point at the v3 evolution — out of scope for this POC unless time allows.
