import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BBOX = { minLon: 106.68, maxLon: 107.01, minLat: -6.38, maxLat: -6.08 };
const IDS = ["jakpus", "jakbar", "jaksel", "jakut", "jaktim"];

const fc = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/data/landmarks.geojson"), "utf-8"),
);

describe("landmarks.geojson", () => {
  it("is a FeatureCollection of Point features with district + name", () => {
    expect(fc.type).toBe("FeatureCollection");
    for (const f of fc.features) {
      expect(f.geometry.type).toBe("Point");
      expect(IDS).toContain(f.properties.district);
      expect(typeof f.properties.name).toBe("string");
      expect(f.properties.name.length).toBeGreaterThan(0);
    }
  });

  it("gives every district at least one landmark", () => {
    for (const id of IDS) {
      const n = fc.features.filter(
        (f: any) => f.properties.district === id,
      ).length;
      expect(n, `landmarks for ${id}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("keeps every point inside the Jakarta bbox", () => {
    for (const f of fc.features) {
      const [lon, lat] = f.geometry.coordinates;
      expect(lon).toBeGreaterThanOrEqual(BBOX.minLon);
      expect(lon).toBeLessThanOrEqual(BBOX.maxLon);
      expect(lat).toBeGreaterThanOrEqual(BBOX.minLat);
      expect(lat).toBeLessThanOrEqual(BBOX.maxLat);
    }
  });
});
