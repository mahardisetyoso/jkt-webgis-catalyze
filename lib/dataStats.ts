// Hero statistics computed from the map data itself, so every number on screen
// can be traced to the GeoJSON files in public/data (nothing typed in by hand).

type Position = number[];
type Geometry =
  | { type: "Polygon"; coordinates: Position[][] }
  | { type: "MultiPolygon"; coordinates: Position[][][] }
  | { type: string; coordinates?: unknown };
type FeatureCollection = { features: { geometry: Geometry }[] };

export type HeroStats = {
  districts: number;
  landmarks: number;
  photos: number;
  areaKm2: number;
};

const EARTH_RADIUS_KM = 6371.0088;
const RAD = Math.PI / 180;

// Spherical polygon ring area (Chamberlain-Duquette), absolute km².
function ringAreaKm2(ring: Position[]): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    sum += (lon2 - lon1) * RAD * (2 + Math.sin(lat1 * RAD) + Math.sin(lat2 * RAD));
  }
  return Math.abs((sum * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

// First ring is the outline, the rest are holes.
function polygonAreaKm2(rings: Position[][]): number {
  return rings.reduce((area, ring, i) => area + (i === 0 ? 1 : -1) * ringAreaKm2(ring), 0);
}

export function geometryAreaKm2(geometry: Geometry): number {
  if (geometry.type === "Polygon") {
    return polygonAreaKm2((geometry as { coordinates: Position[][] }).coordinates);
  }
  if (geometry.type === "MultiPolygon") {
    return (geometry as { coordinates: Position[][][] }).coordinates.reduce(
      (area, polygon) => area + polygonAreaKm2(polygon),
      0,
    );
  }
  return 0;
}

export function computeHeroStats(
  districts: FeatureCollection,
  landmarks: FeatureCollection,
  photos: number,
): HeroStats {
  const areaKm2 = districts.features.reduce(
    (total, feature) => total + geometryAreaKm2(feature.geometry),
    0,
  );
  return {
    districts: districts.features.length,
    landmarks: landmarks.features.length,
    photos,
    areaKm2: Math.round(areaKm2),
  };
}
