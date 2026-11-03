export type MapView = { center: [number, number]; zoom: number };

// Camera presets (center = [lon, lat]). The story flies between these; the
// district views are pinned, not computed from geometry centroids, so a
// MultiPolygon's offshore parts never pull the camera seaward.
export const mapViews: Record<string, MapView> = {
  overview: { center: [106.84, -6.21], zoom: 10.2 },
  jakpus: { center: [106.835, -6.19], zoom: 12.4 },
  jakbar: { center: [106.76, -6.16], zoom: 11.8 },
  jaksel: { center: [106.81, -6.28], zoom: 11.9 },
  jakut: { center: [106.82, -6.13], zoom: 11.2 },
  jaktim: { center: [106.9, -6.25], zoom: 11.4 },
};
