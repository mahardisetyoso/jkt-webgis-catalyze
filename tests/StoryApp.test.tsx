import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

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

vi.mock("../components/MapCanvas", () => ({
  default: (props: any) => (
    <div
      data-testid="map"
      data-active={String(props.activeDistrictId)}
      data-mode={props.mode}
      data-congestion={String(props.showCongestion)}
    />
  ),
}));

import StoryApp from "../components/StoryApp";
import { chapters } from "../lib/chapters";

const idx = (id: string) => chapters.findIndex((c) => c.id === id);

describe("StoryApp", () => {
  beforeEach(() => {
    enterCb = null;
  });

  it("renders a panel for every chapter", () => {
    render(<StoryApp />);
    expect(screen.getAllByRole("heading")).toHaveLength(chapters.length);
  });

  it("passes the active district to the map on step enter", () => {
    render(<StoryApp />);
    act(() => enterCb!({ index: idx("jaksel") }));
    expect(screen.getByTestId("map").getAttribute("data-active")).toBe("jaksel");
  });

  it("turns congestion on for the Jakarta Pusat chapter", () => {
    render(<StoryApp />);
    act(() => enterCb!({ index: idx("jakpus") }));
    expect(screen.getByTestId("map").getAttribute("data-congestion")).toBe("true");
  });

  it("enters explore mode from the outro and shows the explore panel", () => {
    render(<StoryApp />);
    act(() => enterCb!({ index: idx("outro") }));
    fireEvent.click(screen.getByRole("button", { name: /jelajahi/i }));
    expect(screen.getByTestId("map").getAttribute("data-mode")).toBe("explore");
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
  });
});
