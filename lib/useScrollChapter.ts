import { useState } from "react";

// Maps a 0..1 scroll progress to a chapter index, clamped to [0, count-1].
export function activeChapterIndex(progress: number, count: number): number {
  const idx = Math.floor(progress * count);
  return Math.min(count - 1, Math.max(0, idx));
}

// Minimal active-chapter state; the Scroller drives it via step-enter callbacks.
export function useScrollChapter(initial = 0) {
  const [active, setActive] = useState(initial);
  return { active, setActive };
}
