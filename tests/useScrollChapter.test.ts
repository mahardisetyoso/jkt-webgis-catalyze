import { describe, it, expect } from "vitest";
import { activeChapterIndex } from "../lib/useScrollChapter";

describe("activeChapterIndex", () => {
  it("maps progress 0 to the first chapter", () => {
    expect(activeChapterIndex(0, 7)).toBe(0);
  });

  it("maps progress 1 to the last chapter", () => {
    expect(activeChapterIndex(1, 7)).toBe(6);
  });

  it("clamps out-of-range progress", () => {
    expect(activeChapterIndex(-0.5, 7)).toBe(0);
    expect(activeChapterIndex(2, 7)).toBe(6);
  });
});
