import type { StyleSpecification } from "maplibre-gl";

export type BasemapEnv = {
  maptilerKey?: string;
  maptilerStyle?: string;
};

const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Keyless fallback: OSM standard raster tiles, darkened so the story layers carry
// the colour. Allowed for light, attributed, browser-originated use with no SLA
// (https://operations.osmfoundation.org/policies/tiles/) — fine for local dev and
// previews, not something to run production traffic on.
export const OSM_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: OSM_ATTRIBUTION,
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#0a1524" } },
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: {
        "raster-saturation": -0.85,
        "raster-brightness-max": 0.5,
        "raster-contrast": 0.1,
      },
    },
  ],
};

// MapTiler vector basemap when a key is configured (production), OSM raster
// otherwise. The style is config, not code: set NEXT_PUBLIC_MAPTILER_KEY (and
// optionally NEXT_PUBLIC_MAPTILER_STYLE) in .env.local / Vercel.
export function basemapStyle(env: BasemapEnv): string | StyleSpecification {
  const key = env.maptilerKey?.trim();
  if (!key) return OSM_FALLBACK_STYLE;
  const style = env.maptilerStyle?.trim() || "dataviz-dark";
  return `https://api.maptiler.com/maps/${encodeURIComponent(style)}/style.json?key=${encodeURIComponent(key)}`;
}

// Next.js inlines NEXT_PUBLIC_* at build time only for literal property access.
export function basemapFromProcessEnv(): string | StyleSpecification {
  return basemapStyle({
    maptilerKey: process.env.NEXT_PUBLIC_MAPTILER_KEY,
    maptilerStyle: process.env.NEXT_PUBLIC_MAPTILER_STYLE,
  });
}
