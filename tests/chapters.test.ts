import { describe, it, expect } from "vitest";
import { chapters } from "../lib/chapters";
import { mapViews } from "../lib/mapViews";

const BBOX = { minLon: 106.68, maxLon: 107.01, minLat: -6.38, maxLat: -6.08 };
const ORDER = ["intro", "jakpus", "jakbar", "jaksel", "jakut", "jaktim", "outro"];
const DISTRICTS = ["jakpus", "jakbar", "jaksel", "jakut", "jaktim"];

describe("chapters", () => {
  it("has 7 chapters in the expected order", () => {
    expect(chapters.map((c) => c.id)).toEqual(ORDER);
  });

  it("points each non-null districtId at a canonical id", () => {
    for (const c of chapters) {
      if (c.districtId !== null) expect(DISTRICTS).toContain(c.districtId);
    }
  });

  it("uses a view that exists in mapViews for every chapter", () => {
    const views = Object.values(mapViews);
    for (const c of chapters) expect(views).toContainEqual(c.view);
  });

  it("keeps every camera view in-bbox with a sane zoom", () => {
    for (const v of Object.values(mapViews)) {
      expect(v.center[0]).toBeGreaterThanOrEqual(BBOX.minLon);
      expect(v.center[0]).toBeLessThanOrEqual(BBOX.maxLon);
      expect(v.center[1]).toBeGreaterThanOrEqual(BBOX.minLat);
      expect(v.center[1]).toBeLessThanOrEqual(BBOX.maxLat);
      expect(v.zoom).toBeGreaterThanOrEqual(9);
      expect(v.zoom).toBeLessThanOrEqual(16);
    }
  });

  it("flags only the jakpus chapter for congestion", () => {
    for (const c of chapters) {
      if (c.id === "jakpus") expect(c.congestion).toBe(true);
      else expect(c.congestion).not.toBe(true);
    }
  });
});
