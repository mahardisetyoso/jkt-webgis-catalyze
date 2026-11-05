export type MapView = {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
};

// Camera presets (center = [lon, lat]). The story flies between these; the
// district views are pinned, not computed from geometry centroids, so a
// MultiPolygon's offshore parts never pull the camera seaward. Centers point at
// the subject itself — the chapter card is kept clear by camera padding
// (see cameraPadding in lib/mapLayers.ts), not by nudging the center.
export const mapViews: Record<string, MapView> = {
  overview: { center: [106.83, -6.215], zoom: 10.4, pitch: 0, bearing: 0 },
  // Street-level "among the buildings": deep zoom + high pitch (needs maxPitch
  // raised in MapCanvas). At this extreme the district boundary and markers fall
  // out of frame — the trade for the immersive POV.
  jakpus: { center: [106.8105, -6.2235], zoom: 16.3, pitch: 76, bearing: -18 },
  jakbar: { center: [106.789, -6.169], zoom: 16.3, pitch: 76, bearing: 12 },
  jaksel: { center: [106.7985, -6.2445], zoom: 16.3, pitch: 76, bearing: -10 },
  jakut: { center: [106.8135, -6.1465], zoom: 16.3, pitch: 76, bearing: 8 },
  jaktim: { center: [106.906, -6.185], zoom: 16.3, pitch: 76, bearing: -8 },
};
