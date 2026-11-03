import type {
  DataDrivenPropertyValueSpecification,
  ExpressionSpecification,
  FilterSpecification,
} from "maplibre-gl";

export type Mode = "story" | "explore";

const NONE = "__none__";

// Fill opacity by district: active brightest, hovered mid, the rest dimmed.
export function districtFillPaint(
  activeId: string | null,
  hoverId: string | null,
): { "fill-color": string; "fill-opacity": DataDrivenPropertyValueSpecification<number> } {
  return {
    "fill-color": "#1e88e5",
    "fill-opacity": [
      "case",
      ["==", ["get", "id"], activeId ?? NONE],
      0.55,
      ["==", ["get", "id"], hoverId ?? NONE],
      0.35,
      0.08,
    ] as unknown as DataDrivenPropertyValueSpecification<number>,
  };
}

// Show only the active district's landmarks; none when nothing is active.
export function landmarkFilter(activeId: string | null): FilterSpecification {
  return ["==", ["get", "district"], activeId ?? NONE] as ExpressionSpecification;
}

// Static red fill for congested (macet) geohash cells.
export function congestionPaint(): { "fill-color": string; "fill-opacity": number } {
  return { "fill-color": "#e53935", "fill-opacity": 0.5 };
}

// Reduced motion jumps instantly; otherwise animate the camera.
export function cameraMove(reducedMotion: boolean): "jumpTo" | "flyTo" {
  return reducedMotion ? "jumpTo" : "flyTo";
}

// Free pan/zoom only in explore mode; the story locks the camera to chapters.
export function mapInteractive(mode: Mode): boolean {
  return mode === "explore";
}
