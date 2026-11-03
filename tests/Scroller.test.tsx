import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

let enterCb: ((r: { index: number }) => void) | null = null;

vi.mock("scrollama", () => ({
  default: () => ({
    setup() {
      return this;
    },
    onStepEnter(cb: (r: { index: number }) => void) {
      enterCb = cb;
      return this;
    },
    onStepExit() {
      return this;
    },
    resize() {
      return this;
    },
    destroy() {},
  }),
}));

import Scroller from "../components/Scroller";
import { chapters } from "../lib/chapters";

describe("Scroller", () => {
  beforeEach(() => {
    enterCb = null;
  });

  it("renders one panel per chapter", () => {
    render(<Scroller chapters={chapters} onChapter={() => {}} />);
    expect(screen.getAllByRole("heading")).toHaveLength(chapters.length);
  });

  it("calls onChapter with the step index on enter", () => {
    const onChapter = vi.fn();
    render(<Scroller chapters={chapters} onChapter={onChapter} />);
    expect(enterCb).toBeTypeOf("function");
    enterCb!({ index: 3 });
    expect(onChapter).toHaveBeenCalledWith(3);
  });
});
