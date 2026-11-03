import { describe, it, expect } from "vitest";
import {
  districtFillPaint,
  landmarkFilter,
  congestionPaint,
  cameraMove,
  mapInteractive,
  districtColorExpr,
  districtIdFilter,
  congestionPulseOpacity,
  cameraPadding,
} from "../lib/mapLayers";
import { districtColors } from "../lib/chapters";

// Minimal evaluator for the subset of MapLibre expressions we build.
function evalExpr(expr: any, props: Record<string, unknown>): any {
  if (!Array.isArray(expr)) return expr;
  const [op, ...args] = expr;
  if (op === "get") return props[args[0] as string];
  if (op === "match") {
    const v = evalExpr(args[0], props);
    for (let i = 1; i + 1 < args.length; i += 2) if (args[i] === v) return args[i + 1];
    return args[args.length - 1];
  }
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

  it("shows every district at base opacity when none is active", () => {
    const op = districtFillPaint(null, null)["fill-opacity"];
    expect(evalExpr(op, { id: "jakut" })).toBe(0.35);
    expect(evalExpr(op, { id: "jakbar" })).toBe(0.35);
  });

  it("lifts a hovered district above the base when none is active", () => {
    const op = districtFillPaint(null, "jakut")["fill-opacity"];
    expect(evalExpr(op, { id: "jakut" })).toBe(0.6);
    expect(evalExpr(op, { id: "jakbar" })).toBe(0.35);
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

describe("districtColorExpr", () => {
  it("gives each district its own accent colour and a fallback otherwise", () => {
    const e = districtColorExpr();
    for (const [id, c] of Object.entries(districtColors)) {
      expect(evalExpr(e, { id })).toBe(c);
    }
    expect(evalExpr(e, { id: "kepseribu" })).toBe("#8a99ad");
  });
});

describe("districtIdFilter", () => {
  it("matches only the given district, nothing when null", () => {
    expect(evalExpr(districtIdFilter("jakut"), { id: "jakut" })).toBe(true);
    expect(evalExpr(districtIdFilter("jakut"), { id: "jaksel" })).toBe(false);
    expect(evalExpr(districtIdFilter(null), { id: "jakut" })).toBe(false);
  });
});

describe("congestionPulseOpacity", () => {
  it("stays within a visible range", () => {
    for (let t = 0; t < 10; t += 0.13) {
      const o = congestionPulseOpacity(t);
      expect(o).toBeGreaterThanOrEqual(0.2);
      expect(o).toBeLessThanOrEqual(0.7);
    }
  });
});

describe("cameraPadding", () => {
  it("reserves the left for the card on desktop story", () => {
    const p = cameraPadding(1440, 900, "story");
    expect(p.left).toBeGreaterThan(400);
    expect(p.bottom).toBeLessThan(100);
  });
  it("reserves the bottom for the card on mobile story", () => {
    const p = cameraPadding(390, 844, "story");
    expect(p.bottom).toBeGreaterThan(300);
    expect(p.left).toBeLessThan(50);
  });
  it("uses small even padding in explore", () => {
    const p = cameraPadding(1440, 900, "explore");
    expect(p.left).toBeLessThan(50);
  });
});
