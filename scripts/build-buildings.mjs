// Builds public/data/buildings.geojson: OSM building footprints with a known
// height (height or building:levels tag) in the Sudirman–SCBD area, for the
// MapLibre 3D fill-extrusion layer. Run: npm run data:buildings
// Source: © OpenStreetMap contributors (ODbL), via Overpass API.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Sudirman corridor + SCBD: S, W, N, E
const BBOX = [-6.232, 106.803, -6.208, 106.824];
const OUT = resolve("public/data/buildings.geojson");
const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const [S, W, N, E] = BBOX;
// All building footprints in the bbox (not only tagged ones), so coverage is even.
const QUERY = `[out:json][timeout:180];(
  way["building"](${S},${W},${N},${E});
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
