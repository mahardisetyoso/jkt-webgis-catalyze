import { describe, it, expect } from "vitest";
import {
  districtFillPaint,
  landmarkFilter,
  congestionPaint,
  cameraMove,
  mapInteractive,
} from "../lib/mapLayers";

// Minimal evaluator for the subset of MapLibre expressions we build.
function evalExpr(expr: any, props: Record<string, unknown>): any {
  if (!Array.isArray(expr)) return expr;
  const [op, ...args] = expr;
  if (op === "get") return props[args[0] as string];
  if (op === "==") return evalExpr(args[0], props) === evalExpr(args[1], props);
  if (op === "case") {
    for (let i = 0; i + 1 < args.length; i += 2) {
      if (evalExpr(args[i], props)) return evalExpr(args[i + 1], props);
    }
    return evalExpr(args[args.length - 1], props);
  }
  return expr;
}

describe("districtFillPaint", () => {
  it("gives the active district the active opacity and others the dim one", () => {
    const op = districtFillPaint("jaksel", null)["fill-opacity"];
    expect(evalExpr(op, { id: "jaksel" })).toBe(0.55);
    expect(evalExpr(op, { id: "jakbar" })).toBe(0.08);
  });

  it("gives a hovered district the hover opacity", () => {
    const op = districtFillPaint(null, "jakut")["fill-opacity"];
    expect(evalExpr(op, { id: "jakut" })).toBe(0.35);
    expect(evalExpr(op, { id: "jakbar" })).toBe(0.08);
  });
});

describe("landmarkFilter", () => {
  it("excludes all landmarks when no district is active", () => {
    const f = landmarkFilter(null);
    expect(evalExpr(f, { district: "jakpus" })).toBe(false);
  });

  it("matches only the active district's landmarks", () => {
    const f = landmarkFilter("jakpus");
    expect(evalExpr(f, { district: "jakpus" })).toBe(true);
    expect(evalExpr(f, { district: "jaksel" })).toBe(false);
  });
});

describe("congestionPaint", () => {
  it("is a red fill", () => {
    expect(congestionPaint()["fill-color"]).toBe("#e53935");
  });
});

describe("cameraMove", () => {
  it("jumps when reduced motion, flies otherwise", () => {
    expect(cameraMove(true)).toBe("jumpTo");
    expect(cameraMove(false)).toBe("flyTo");
  });
});

describe("mapInteractive", () => {
  it("is interactive only in explore mode", () => {
    expect(mapInteractive("explore")).toBe(true);
    expect(mapInteractive("story")).toBe(false);
  });
});
