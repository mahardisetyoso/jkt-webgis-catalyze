// Builds public/data/jakarta-districts.geojson from GADM 4.1 Indonesia ADM2.
// Source: https://gadm.org (GADM 4.1). License restricts redistribution/
// commercial use; we ship only a simplified derivative for this non-commercial
// assessment. Run: npm run data:districts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { unzipSync } from "fflate";

const URL =
  "https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_IDN_2.json.zip";
const CACHE = resolve(".cache/gadm");
const SRC = resolve(CACHE, "gadm41_IDN_2.json");
const OUT = resolve("public/data/jakarta-districts.geojson");

// GADM NAME_2 (no spaces) -> our canonical id + display name.
const NAME_MAP = {
  JakartaPusat: { id: "jakpus", name: "Jakarta Pusat" },
  JakartaBarat: { id: "jakbar", name: "Jakarta Barat" },
  JakartaSelatan: { id: "jaksel", name: "Jakarta Selatan" },
  JakartaUtara: { id: "jakut", name: "Jakarta Utara" },
  JakartaTimur: { id: "jaktim", name: "Jakarta Timur" },
};
const ORDER = ["jakpus", "jakbar", "jaksel", "jakut", "jaktim"];

async function ensureSource() {
  if (existsSync(SRC)) return;
  mkdirSync(CACHE, { recursive: true });
  const res = await fetch(URL);
  if (!res.ok) throw new Error(`GADM download failed: ${res.status}`);
  const files = unzipSync(new Uint8Array(await res.arrayBuffer()));
  const name = Object.keys(files).find((f) => f.endsWith(".json"));
  if (!name) throw new Error("no .json inside GADM zip");
  writeFileSync(SRC, Buffer.from(files[name]));
}

const round = (n) => Math.round(n * 1e5) / 1e5; // ~1.1 m precision
const roundCoords = (c) =>
  typeof c[0] === "number" ? [round(c[0]), round(c[1])] : c.map(roundCoords);

async function main() {
  await ensureSource();
  const gadm = JSON.parse(readFileSync(SRC, "utf-8"));
  const byId = {};
  for (const f of gadm.features) {
    if (f.properties.NAME_1 !== "JakartaRaya") continue;
    const m = NAME_MAP[f.properties.NAME_2];
    if (!m) continue; // excludes Kepulauan Seribu
    byId[m.id] = {
      type: "Feature",
      properties: { id: m.id, name: m.name },
      geometry: {
        type: f.geometry.type,
        coordinates: roundCoords(f.geometry.coordinates),
      },
    };
  }
  const features = ORDER.map((id) => byId[id]).filter(Boolean);
  if (features.length !== 5) {
    throw new Error(`expected 5 Jakarta kota, got ${features.length}`);
  }
  const fc = { type: "FeatureCollection", features };
  mkdirSync(resolve("public/data"), { recursive: true });
  writeFileSync(OUT, JSON.stringify(fc));
  const kb = (readFileSync(OUT).length / 1024).toFixed(0);
  console.log(`wrote ${features.length} features -> ${OUT} (${kb} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
