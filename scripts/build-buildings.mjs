// Builds public/data/buildings.geojson: OSM building footprints with a known
// height (height or building:levels tag) in the Sudirman–SCBD area, for the
// MapLibre 3D fill-extrusion layer. Run: npm run data:buildings
// Source: © OpenStreetMap contributors (ODbL), via Overpass API.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// One dense signature area per district (center lon, lat) — each chapter's
// camera zooms here, so every district gets a 3D cluster.
const CLUSTERS = [
  { id: "jakpus", lon: 106.812, lat: -6.219 }, // Sudirman / SCBD
  { id: "jakbar", lon: 106.789, lat: -6.17 }, // Grogol (Trisakti/Untar)
  { id: "jaksel", lon: 106.806, lat: -6.251 }, // Blok M
  { id: "jakut", lon: 106.813, lat: -6.148 }, // Glodok / Pecinan
  { id: "jaktim", lon: 106.905, lat: -6.186 }, // Pulogadung
];
const HALF_LON = 0.0075; // ~0.83 km
const HALF_LAT = 0.0065; // ~0.72 km
const OUT = resolve("public/data/buildings.geojson");
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

// All building footprints in each cluster bbox (not only tagged), so coverage is even.
const QUERY = `[out:json][timeout:240];(
${CLUSTERS.map(
  (c) =>
    `  way["building"](${(c.lat - HALF_LAT).toFixed(5)},${(c.lon - HALF_LON).toFixed(5)},${(c.lat + HALF_LAT).toFixed(5)},${(c.lon + HALF_LON).toFixed(5)});`,
).join("\n")}
);out geom;`;

const round = (n) => Math.round(n * 1e5) / 1e5; // ~1 m

function heightOf(tags = {}) {
  if (tags.height) {
    const h = parseFloat(String(tags.height).replace(/[^0-9.]/g, ""));
    if (h > 0) return Math.round(h * 10) / 10;
  }
  if (tags["building:levels"]) {
    const l = parseFloat(tags["building:levels"]);
    if (l > 0) return Math.round(l * 3.3 * 10) / 10;
  }
  return 10; // untagged low-rise default (metres)
}

async function fetchOverpass() {
  const body = "data=" + encodeURIComponent(QUERY);
  for (const url of ENDPOINTS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "jakarta-webgis-poc/1.0 (assessment)",
          },
          body,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (e) {
        console.warn(`Overpass ${url} attempt ${attempt} failed: ${e.message}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw new Error("all Overpass endpoints failed");
}

function toFeature(el) {
  const geom = el.geometry;
  if (!Array.isArray(geom) || geom.length < 4) return null;
  const ring = geom.map((g) => [round(g.lon), round(g.lat)]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
  return {
    type: "Feature",
    properties: {
      height: heightOf(el.tags),
      name: el.tags?.name ?? null,
    },
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}

async function main() {
  const data = await fetchOverpass();
  const features = (data.elements ?? [])
    .filter((el) => el.type === "way")
    .map(toFeature)
    .filter(Boolean);
  if (features.length === 0) throw new Error("no building footprints returned");
  const fc = { type: "FeatureCollection", features };
  mkdirSync(resolve("public/data"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(fc));
  const kb = (readFileSync(OUT).length / 1024).toFixed(0);
  console.log(`wrote ${features.length} buildings -> ${OUT} (${kb} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
