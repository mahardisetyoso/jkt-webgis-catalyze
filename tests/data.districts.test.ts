import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BBOX = { minLon: 106.68, maxLon: 107.01, minLat: -6.38, maxLat: -6.08 };
const IDS = ["jakpus", "jakbar", "jaksel", "jakut", "jaktim"];

function loadGeojson(rel: string) {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), rel), "utf-8"),
  );
}

function eachCoord(geometry: any, fn: (lon: number, lat: number) => void) {
  const walk = (a: any) => {
    if (typeof a[0] === "number") fn(a[0], a[1]);
    else a.forEach(walk);
  };
  walk(geometry.coordinates);
}

describe("jakarta-districts.geojson", () => {
  const fc = loadGeojson("public/data/jakarta-districts.geojson");

  it("is a FeatureCollection of exactly 5 features", () => {
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features).toHaveLength(5);
  });

  it("covers the five canonical municipality ids", () => {
    const ids = fc.features.map((f: any) => f.properties.id).sort();
    expect(ids).toEqual([...IDS].sort());
  });

  it("gives every feature a display name", () => {
    for (const f of fc.features) {
      expect(typeof f.properties.name).toBe("string");
      expect(f.properties.name.length).toBeGreaterThan(0);
    }
  });

  it("uses only Polygon or MultiPolygon geometry", () => {
    for (const f of fc.features) {
      expect(["Polygon", "MultiPolygon"]).toContain(f.geometry.type);
    }
  });

  it("keeps every coordinate inside the Jakarta bbox", () => {
    for (const f of fc.features) {
      eachCoord(f.geometry, (lon, lat) => {
        expect(lon).toBeGreaterThanOrEqual(BBOX.minLon);
        expect(lon).toBeLessThanOrEqual(BBOX.maxLon);
        expect(lat).toBeGreaterThanOrEqual(BBOX.minLat);
        expect(lat).toBeLessThanOrEqual(BBOX.maxLat);
      });
    }
  });
});
