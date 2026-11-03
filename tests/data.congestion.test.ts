import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Sudirman corridor sanity window
const COR = { minLon: 106.8, maxLon: 106.83, minLat: -6.22, maxLat: -6.19 };

const fc = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/data/congestion.geojson"), "utf-8"),
);

function centroid(ring: number[][]) {
  const lon = ring.reduce((s, p) => s + p[0], 0) / ring.length;
  const lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
  return [lon, lat];
}

describe("congestion.geojson", () => {
  it("is a non-empty FeatureCollection of macet Polygon cells", () => {
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features.length).toBeGreaterThan(0);
    for (const f of fc.features) {
      expect(f.geometry.type).toBe("Polygon");
      expect(f.properties.status).toBe("macet");
      expect(f.properties.corridor).toBe("Sudirman");
      expect(f.properties.geohash).toMatch(/^[0-9a-z]{7}$/);
    }
  });

  it("has unique geohashes", () => {
    const hashes = fc.features.map((f: any) => f.properties.geohash);
    expect(new Set(hashes).size).toBe(hashes.length);
  });

  it("places every cell centroid along the Sudirman corridor", () => {
    for (const f of fc.features) {
      const [lon, lat] = centroid(f.geometry.coordinates[0]);
      expect(lon).toBeGreaterThanOrEqual(COR.minLon);
      expect(lon).toBeLessThanOrEqual(COR.maxLon);
      expect(lat).toBeGreaterThanOrEqual(COR.minLat);
      expect(lat).toBeLessThanOrEqual(COR.maxLat);
    }
  });
});
