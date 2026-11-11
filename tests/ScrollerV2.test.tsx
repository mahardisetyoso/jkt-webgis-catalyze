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

import ScrollerV2 from "../components/v2/ScrollerV2";
import { chapters } from "../lib/chapters";

describe("ScrollerV2", () => {
  beforeEach(() => {
    enterCb = null;
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }) as MediaQueryList,
    );
  });

  it("renders one panel per chapter", () => {
    render(<ScrollerV2 chapters={chapters} onChapter={() => {}} onExplore={() => {}} />);
    expect(screen.getAllByRole("heading")).toHaveLength(chapters.length);
  });

  it("calls onChapter with the step index on enter", () => {
    const onChapter = vi.fn();
    render(<ScrollerV2 chapters={chapters} onChapter={onChapter} onExplore={() => {}} />);
    expect(enterCb).toBeTypeOf("function");
    enterCb!({ index: 3 });
    expect(onChapter).toHaveBeenCalledWith(3);
  });

  it("passes the stats down to the hero", () => {
    render(
      <ScrollerV2
        chapters={chapters}
        onChapter={() => {}}
        onExplore={() => {}}
        stats={{ districts: 5, landmarks: 12, photos: 6, areaKm2: 645 }}
      />,
    );
    expect(screen.getByText("Landmark di peta")).toBeInTheDocument();
  });
});
