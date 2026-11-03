import type { CSSProperties } from "react";
import type { Chapter } from "@/lib/chapters";

type Props = {
  chapters: Chapter[];
  active: number;
  onSelect: (index: number) => void;
};

// Vertical chapter navigator (as on the Lancaster Sound reference): one dot per
// chapter, the active one filled with the district colour.
export default function ChapterDots({ chapters, active, onSelect }: Props) {
  return (
    <nav className="chapter-dots" aria-label="Bab cerita">
      {chapters.map((c, i) => (
        <button
          key={c.id}
          type="button"
          aria-label={c.title}
          aria-current={i === active ? "step" : undefined}
          className={i === active ? "on" : undefined}
          style={{ "--c": c.color ?? "#ffffff" } as CSSProperties}
          onClick={() => onSelect(i)}
        >
          <span aria-hidden="true">{c.title}</span>
        </button>
      ))}
    </nav>
  );
}
