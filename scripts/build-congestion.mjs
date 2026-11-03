// Builds public/data/congestion.geojson: geohash (precision 7) cells tracing the
// Jalan Sudirman corridor, flagged "macet" (heavy traffic). Static sample data
// for the POC; a live feed would recolor these cells by real-time speed.
// Run: npm run data:congestion
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import ngeohash from "ngeohash";

const OUT = resolve("public/data/congestion.geojson");
const PRECISION = 7;

// Jalan Sudirman centerline: Bundaran HI -> Semanggi (lon, lat).
const START = [106.8229, -6.1944];
const END = [106.8117, -6.218];
const SAMPLES = 40;

function cellPolygon(hash) {
  const [minLat, minLon, maxLat, maxLon] = ngeohash.decode_bbox(hash);
  return [
    [minLon, minLat],
    [maxLon, minLat],
    [maxLon, maxLat],
    [minLon, maxLat],
    [minLon, minLat],
  ];
}

function main() {
  const seen = new Set();
  const features = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    const lon = START[0] + (END[0] - START[0]) * t;
    const lat = START[1] + (END[1] - START[1]) * t;
    const hash = ngeohash.encode(lat, lon, PRECISION);
    if (seen.has(hash)) continue;
    seen.add(hash);
    features.push({
      type: "Feature",
      properties: { geohash: hash, status: "macet", corridor: "Sudirman" },
      geometry: { type: "Polygon", coordinates: [cellPolygon(hash)] },
    });
  }
  const fc = { type: "FeatureCollection", features };
  mkdirSync(resolve("public/data"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(fc));
  const kb = (readFileSync(OUT).length / 1024).toFixed(1);
  console.log(`wrote ${features.length} geohash cells -> ${OUT} (${kb} KB)`);
}

main();
