import type {
  DataDrivenPropertyValueSpecification,
  ExpressionSpecification,
  FilterSpecification,
} from "maplibre-gl";
import { districtColors } from "./chapters";

export type Mode = "story" | "explore";

const NONE = "__none__";

// Per-district accent colour, as a MapLibre `match` expression on the id.
// `prop` is "id" on district polygons and "district" on landmark points.
export function districtColorExpr(prop: "id" | "district" = "id"): ExpressionSpecification {
  return [
    "match",
    ["get", prop],
    ...Object.entries(districtColors).flat(),
    "#8a99ad",
  ] as unknown as ExpressionSpecification;
}

// Fill opacity by district: active brightest, hovered mid, the rest dimmed.
export function districtFillPaint(
  activeId: string | null,
  hoverId: string | null,
): {
  "fill-color": ExpressionSpecification;
  "fill-opacity": DataDrivenPropertyValueSpecification<number>;
} {
  return {
    "fill-color": districtColorExpr(),
    // With an active district (story chapter) the rest fade back; with none
    // (intro, outro, explore) every district shows its colour and hover lifts one.
    "fill-opacity": (activeId
      ? ["case", ["==", ["get", "id"], activeId], 0.55, 0.08]
      : ["case", ["==", ["get", "id"], hoverId ?? NONE], 0.6, 0.35]
    ) as unknown as DataDrivenPropertyValueSpecification<number>,
  };
}

// Show only the active district's landmarks; none when nothing is active.
export function landmarkFilter(activeId: string | null): FilterSpecification {
  return ["==", ["get", "district"], activeId ?? NONE] as ExpressionSpecification;
}

// Reduced motion jumps instantly; otherwise animate the camera.
export function cameraMove(reducedMotion: boolean): "jumpTo" | "flyTo" {
  return reducedMotion ? "jumpTo" : "flyTo";
}

// Free pan/zoom only in explore mode; the story locks the camera to chapters.
export function mapInteractive(mode: Mode): boolean {
  return mode === "explore";
}

// Matches only the given district (or nothing) — used for the active outline/glow.
export function districtIdFilter(id: string | null): FilterSpecification {
  return ["==", ["get", "id"], id ?? NONE] as ExpressionSpecification;
}

// 3D building extrusion: height (metres) read from each feature's `height` prop.
export function buildingExtrusionPaint(): {
  "fill-extrusion-color": string;
  "fill-extrusion-height": DataDrivenPropertyValueSpecification<number>;
  "fill-extrusion-base": number;
  "fill-extrusion-opacity": number;
} {
  return {
    "fill-extrusion-color": "#9fb4d0",
    "fill-extrusion-height": [
      "get",
      "height",
    ] as unknown as DataDrivenPropertyValueSpecification<number>,
    "fill-extrusion-base": 0,
    "fill-extrusion-opacity": 0.85,
  };
}

export type Padding = { top: number; bottom: number; left: number; right: number };

// Camera padding that keeps the active subject clear of the chapter card:
// the card sits left on desktop, bottom on narrow screens; explore has no card.
export function cameraPadding(width: number, height: number, mode: Mode): Padding {
  if (mode === "explore") return { top: 60, bottom: 20, left: 20, right: 20 };
  if (width <= 720)
    return { top: 60, bottom: Math.round(height * 0.45), left: 20, right: 20 };
  return { top: 60, bottom: 40, left: Math.round(Math.min(520, width * 0.42)), right: 40 };
}
