import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chapters } from "../lib/chapters";

const districtChapters = chapters.filter((c) => c.districtId !== null);
const photos = chapters.flatMap((c) => c.photos);

describe("district photos", () => {
  it("gives each of the five districts at least one photo", () => {
    expect(districtChapters).toHaveLength(5);
    for (const c of districtChapters) {
      expect(c.photos.length, c.id).toBeGreaterThanOrEqual(1);
    }
  });

  it("has every photo file on disk under public/", () => {
    for (const p of photos) {
      const path = resolve(process.cwd(), "public" + p.src);
      expect(existsSync(path), path).toBe(true);
    }
  });

  it("captions every photo (used as alt text)", () => {
    for (const p of photos) expect(p.caption.trim().length).toBeGreaterThan(0);
  });

  it("names every photo file in CREDITS.md", () => {
    const credits = readFileSync(
      resolve(process.cwd(), "public/images/CREDITS.md"),
      "utf-8",
    );
    for (const p of photos) {
      const file = p.src.split("/").pop()!;
      expect(credits).toContain(file);
    }
  });
});
