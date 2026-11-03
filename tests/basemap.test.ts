import { describe, it, expect } from "vitest";
import { basemapStyle, OSM_FALLBACK_STYLE } from "../lib/basemap";

describe("basemapStyle", () => {
  it("falls back to the OSM raster style when no MapTiler key is set", () => {
    expect(basemapStyle({})).toBe(OSM_FALLBACK_STYLE);
    expect(basemapStyle({ maptilerKey: "   " })).toBe(OSM_FALLBACK_STYLE);
  });

  it("uses the MapTiler dataviz-dark style when a key is set", () => {
    expect(basemapStyle({ maptilerKey: "abc123" })).toBe(
      "https://api.maptiler.com/maps/dataviz-dark/style.json?key=abc123",
    );
  });

  it("honours a custom MapTiler style id", () => {
    expect(basemapStyle({ maptilerKey: "k", maptilerStyle: "streets-v2-dark" })).toBe(
      "https://api.maptiler.com/maps/streets-v2-dark/style.json?key=k",
    );
  });

  it("keeps OSM attribution on the fallback", () => {
    const src = OSM_FALLBACK_STYLE.sources.osm as { attribution?: string };
    expect(src.attribution).toMatch(/OpenStreetMap/);
  });
});
