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

// The map is mocked; its buttons stand in for the real map reporting status.
vi.mock("../components/MapCanvas", () => ({
  default: (props: any) => (
    <div data-testid="map" data-active={String(props.activeDistrictId)} data-mode={props.mode}>
      <button type="button" onClick={() => props.onStatus?.("ready")}>
        map-ready
      </button>
      <button type="button" onClick={() => props.onStatus?.("error")}>
        map-error
      </button>
    </div>
  ),
}));

import StoryAppV2 from "../components/v2/StoryAppV2";
import { chapters } from "../lib/chapters";

const stats = { districts: 5, landmarks: 12, photos: 6, areaKm2: 645 };
const idx = (id: string) => chapters.findIndex((c) => c.id === id);

describe("StoryAppV2", () => {
  beforeEach(() => {
    enterCb = null;
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }) as MediaQueryList,
    );
  });

  describe("story", () => {
    it("renders a panel for every chapter", () => {
      render(<StoryAppV2 stats={stats} />);
      expect(screen.getAllByRole("heading")).toHaveLength(chapters.length);
    });

    it("has exactly one page heading while telling the story", () => {
      render(<StoryAppV2 stats={stats} />);
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    });

    it("passes the active district to the map on step enter", () => {
      render(<StoryAppV2 stats={stats} />);
      act(() => enterCb!({ index: idx("jaksel") }));
      expect(screen.getByTestId("map").getAttribute("data-active")).toBe("jaksel");
    });

    it("offers a chapter navigator that is a labelled nav, not a fake tablist", () => {
      render(<StoryAppV2 stats={stats} />);
      const nav = screen.getByRole("navigation", { name: "Bab" });
      expect(nav.querySelectorAll("button")).toHaveLength(chapters.length);
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
      expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    });

    it("marks the current chapter in the navigator", () => {
      render(<StoryAppV2 stats={stats} />);
      act(() => enterCb!({ index: idx("jakut") }));
      const nav = screen.getByRole("navigation", { name: "Bab" });
      expect(nav.querySelector('[aria-current="true"]')).toHaveAttribute("aria-label", "Jakarta Utara");
    });

    it("scrolls to a chapter when its dot is pressed", () => {
      const scrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoView;
      render(<StoryAppV2 stats={stats} />);
      fireEvent.click(screen.getByRole("button", { name: "Jakarta Selatan" }));
      expect(scrollIntoView).toHaveBeenCalled();
    });
  });

  describe("modes", () => {
    it("enters explore mode from the nav and shows the explore panel and its heading", () => {
      render(<StoryAppV2 stats={stats} />);
      fireEvent.click(screen.getByRole("button", { name: "Jelajah" }));
      expect(screen.getByTestId("map").getAttribute("data-mode")).toBe("explore");
      expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(0);
      expect(screen.getByRole("heading", { level: 1, name: "Jelajahi peta" })).toBeInTheDocument();
    });

    it("returns to the story from explore", () => {
      render(<StoryAppV2 stats={stats} />);
      fireEvent.click(screen.getByRole("button", { name: "Jelajah" }));
      fireEvent.click(screen.getByRole("button", { name: /kembali ke cerita/i }));
      expect(screen.getByTestId("map").getAttribute("data-mode")).toBe("story");
      expect(screen.getAllByRole("heading")).toHaveLength(chapters.length);
    });

    it("opens the outro call to action in explore mode", () => {
      render(<StoryAppV2 stats={stats} />);
      fireEvent.click(screen.getByRole("button", { name: /jelajahi peta/i }));
      expect(screen.getByTestId("map").getAttribute("data-mode")).toBe("explore");
    });

    it("opens the gallery with its own page heading, then a lightbox from a tile", () => {
      render(<StoryAppV2 stats={stats} />);
      fireEvent.click(screen.getByRole("button", { name: "Galeri" }));
      expect(screen.getByRole("heading", { level: 1, name: "Landmark lima kota" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /SCBD/i }));
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes the lightbox with Escape and returns focus to the tile", () => {
      render(<StoryAppV2 stats={stats} />);
      fireEvent.click(screen.getByRole("button", { name: "Galeri" }));
      const tile = screen.getByRole("button", { name: /SCBD/i });
      tile.focus();
      fireEvent.click(tile);
      expect(screen.getByRole("button", { name: /tutup/i })).toHaveFocus();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(tile).toHaveFocus();
    });
  });

  describe("map status", () => {
    it("shows a loading status until the map reports ready", () => {
      render(<StoryAppV2 stats={stats} />);
      expect(screen.getByRole("status")).toHaveTextContent(/memuat peta/i);
      fireEvent.click(screen.getByText("map-ready"));
      expect(screen.queryByText(/memuat peta/i)).not.toBeInTheDocument();
    });

    it("shows what failed and what to do when the map cannot load", () => {
      render(<StoryAppV2 stats={stats} />);
      fireEvent.click(screen.getByText("map-error"));
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/peta gagal dimuat/i);
      expect(alert).toHaveTextContent(/muat ulang/i);
      expect(screen.getByRole("button", { name: /muat ulang/i })).toBeInTheDocument();
    });
  });
});
