import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { computeHeroStats, geometryAreaKm2 } from "../lib/dataStats";

const read = (name: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), "public/data", name), "utf8"));

describe("geometryAreaKm2", () => {
  it("measures a 0.1 degree square at the equator as about 123.6 km2", () => {
    const square = {
      type: "Polygon" as const,
      coordinates: [[[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1], [0, 0]]],
    };
    expect(Math.abs(geometryAreaKm2(square) - 123.6)).toBeLessThan(0.5);
  });

  it("subtracts holes and sums the parts of a multipolygon", () => {
    const outer = [[0, 0], [0.2, 0], [0.2, 0.2], [0, 0.2], [0, 0]];
    const hole = [[0.05, 0.05], [0.15, 0.05], [0.15, 0.15], [0.05, 0.15], [0.05, 0.05]];
    const withHole = geometryAreaKm2({ type: "Polygon", coordinates: [outer, hole] });
    const solid = geometryAreaKm2({ type: "Polygon", coordinates: [outer] });
    const holeOnly = geometryAreaKm2({ type: "Polygon", coordinates: [hole] });
    expect(withHole).toBeCloseTo(solid - holeOnly, 5);
    const twice = geometryAreaKm2({ type: "MultiPolygon", coordinates: [[outer], [outer]] });
    expect(twice).toBeCloseTo(solid * 2, 5);
  });

  it("returns 0 for non-polygon geometry", () => {
    expect(geometryAreaKm2({ type: "Point", coordinates: [0, 0] })).toBe(0);
  });
});

describe("computeHeroStats on the shipped data", () => {
  const stats = computeHeroStats(read("jakarta-districts.geojson"), read("landmarks.geojson"), 6);

  it("counts districts and landmarks from the files", () => {
    expect(stats.districts).toBe(5);
    expect(stats.landmarks).toBe(read("landmarks.geojson").features.length);
    expect(stats.photos).toBe(6);
  });

  it("computes a plausible land area for the five kota", () => {
    expect(stats.areaKm2).toBeGreaterThan(550);
    expect(stats.areaKm2).toBeLessThan(750);
  });
});
