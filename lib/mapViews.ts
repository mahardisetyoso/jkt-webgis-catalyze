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
  jakpus: { center: [106.812, -6.219], zoom: 14.3, pitch: 52, bearing: -18 },
  jakbar: { center: [106.768, -6.17], zoom: 12.7, pitch: 40, bearing: 12 },
  jaksel: { center: [106.806, -6.252], zoom: 13.2, pitch: 40, bearing: -10 },
  jakut: { center: [106.778, -6.128], zoom: 12.3, pitch: 35, bearing: 8 },
  jaktim: { center: [106.885, -6.24], zoom: 11.3, pitch: 35, bearing: -8 },
};
