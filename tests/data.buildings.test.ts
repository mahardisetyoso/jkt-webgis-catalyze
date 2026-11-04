import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Five district clusters span this loose bound (Grogol → Pulogadung, Glodok → Blok M)
const BBOX = { minLon: 106.77, maxLon: 106.92, minLat: -6.26, maxLat: -6.14 };

const fc = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/data/buildings.geojson"), "utf-8"),
);

function centroid(ring: number[][]) {
  const lon = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  return [lon, lat];
}

describe("buildings.geojson", () => {
  it("is a non-empty FeatureCollection of Polygons", () => {
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features.length).toBeGreaterThan(0);
    for (const f of fc.features) expect(f.geometry.type).toBe("Polygon");
  });

  it("gives every building a positive numeric height", () => {
    for (const f of fc.features) {
      expect(typeof f.properties.height).toBe("number");
      expect(f.properties.height).toBeGreaterThan(0);
    }
  });

  it("places every building in the Sudirman–SCBD area", () => {
    for (const f of fc.features) {
      const [lon, lat] = centroid(f.geometry.coordinates[0]);
      expect(lon).toBeGreaterThanOrEqual(BBOX.minLon);
      expect(lon).toBeLessThanOrEqual(BBOX.maxLon);
      expect(lat).toBeGreaterThanOrEqual(BBOX.minLat);
      expect(lat).toBeLessThanOrEqual(BBOX.maxLat);
    }
  });
});
