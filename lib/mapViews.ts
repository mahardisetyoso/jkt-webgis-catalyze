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
  // Pitch 60 (max) gives the oblique POV; zoom is set to frame each district's
  // landmark points and keep its boundary in view, not to dive in as far as
  // possible — deeper than that would drop the markers and the outline.
  jakpus: { center: [106.8135, -6.217], zoom: 13.9, pitch: 60, bearing: -18 },
  jakbar: { center: [106.789, -6.171], zoom: 14.0, pitch: 60, bearing: 12 },
  jaksel: { center: [106.806, -6.252], zoom: 13.7, pitch: 60, bearing: -10 },
  jakut: { center: [106.8135, -6.148], zoom: 14.2, pitch: 60, bearing: 8 },
  jaktim: { center: [106.906, -6.185], zoom: 14.2, pitch: 60, bearing: -8 },
};
