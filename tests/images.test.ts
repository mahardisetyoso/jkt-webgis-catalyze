import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chapters } from "../lib/chapters";

const withImage = chapters.filter((c) => c.image);

describe("district images", () => {
  it("has an image for each of the five districts", () => {
    expect(withImage).toHaveLength(5);
  });

  it("has every chapter image file on disk under public/", () => {
    for (const c of withImage) {
      const p = resolve(process.cwd(), "public" + c.image);
      expect(existsSync(p), p).toBe(true);
    }
  });

  it("names every image file in CREDITS.md", () => {
    const credits = readFileSync(
      resolve(process.cwd(), "public/images/CREDITS.md"),
      "utf-8",
    );
    for (const c of withImage) {
      const file = c.image!.split("/").pop()!;
      expect(credits).toContain(file);
    }
  });
});
