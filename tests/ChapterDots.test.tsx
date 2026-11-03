import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChapterDots from "../components/ChapterDots";
import { chapters } from "../lib/chapters";

describe("ChapterDots", () => {
  it("renders one labelled dot per chapter and marks the active one", () => {
    render(<ChapterDots chapters={chapters} active={2} onSelect={() => {}} />);
    const dots = screen.getAllByRole("button");
    expect(dots).toHaveLength(chapters.length);
    expect(dots[2]).toHaveAttribute("aria-current", "step");
    expect(dots[0]).not.toHaveAttribute("aria-current");
    expect(dots[2]).toHaveAccessibleName(chapters[2].title);
  });

  it("reports the clicked index", () => {
    const onSelect = vi.fn();
    render(<ChapterDots chapters={chapters} active={0} onSelect={onSelect} />);
    fireEvent.click(screen.getAllByRole("button")[3]);
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
