import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ChapterV2 from "../components/v2/ChapterV2";
import { chapters } from "../lib/chapters";

const stats = { districts: 5, landmarks: 12, photos: 6, areaKm2: 645 };
const byId = (id: string) => chapters.findIndex((c) => c.id === id);

describe("ChapterV2", () => {
  beforeEach(() => {
    // Reduced motion shows final values at once (and skips IntersectionObserver).
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }) as MediaQueryList,
    );
  });

  describe("hero", () => {
    const hero = chapters[byId("intro")];

    it("renders the title as the page heading", () => {
      render(<ChapterV2 chapter={hero} index={0} active onExplore={() => {}} stats={stats} />);
      expect(screen.getByRole("heading", { level: 1, name: "Jakarta" })).toBeInTheDocument();
    });

    it("shows the four tiles with the values passed in, not hand typed numbers", () => {
      render(<ChapterV2 chapter={hero} index={0} active onExplore={() => {}} stats={stats} />);
      expect(screen.getByText("Kota administrasi").previousSibling).toHaveTextContent("5");
      expect(screen.getByText("Landmark di peta").previousSibling).toHaveTextContent("12");
      expect(screen.getByText("Foto lokasi").previousSibling).toHaveTextContent("6");
      expect(screen.getByText("Luas batas GADM").previousSibling).toHaveTextContent("645km²");
    });

    it("states where the numbers come from, without claiming data it does not have", () => {
      render(<ChapterV2 chapter={hero} index={0} active onExplore={() => {}} stats={stats} />);
      expect(screen.getByText(/dihitung langsung dari data geojson/i)).toBeInTheDocument();
      expect(screen.queryByText(/kecamatan|kelurahan/i)).not.toBeInTheDocument();
    });

    it("renders no tiles when there are no stats", () => {
      render(<ChapterV2 chapter={hero} index={0} active onExplore={() => {}} />);
      expect(screen.queryByText("Kota administrasi")).not.toBeInTheDocument();
    });
  });

  describe("district", () => {
    const jakbar = chapters[byId("jakbar")];

    it("renders index, theme badge, title, subtitle and body", () => {
      const { container } = render(
        <ChapterV2 chapter={jakbar} index={2} active={false} onExplore={() => {}} />,
      );
      expect(screen.getByRole("heading", { level: 2, name: "Jakarta Barat" })).toBeInTheDocument();
      expect(container.querySelector(".v2-idx")).toHaveTextContent("02");
      expect(container.querySelector(".v2-badge")).toHaveTextContent(jakbar.theme!);
      expect(screen.getByText(jakbar.subtitle!)).toBeInTheDocument();
      expect(screen.getByText(jakbar.body)).toBeInTheDocument();
    });

    it("gives every photo alt text from its caption", () => {
      render(<ChapterV2 chapter={jakbar} index={2} active={false} onExplore={() => {}} />);
      for (const p of jakbar.photos) {
        expect(screen.getByRole("img", { name: p.caption })).toHaveAttribute("src", p.src);
      }
    });

    it("shows the caption instead of an empty box when a photo fails to load", () => {
      render(<ChapterV2 chapter={jakbar} index={2} active={false} onExplore={() => {}} />);
      const caption = jakbar.photos[0].caption;
      fireEvent.error(screen.getByRole("img", { name: caption }));
      const fallback = screen.getByRole("img", { name: caption });
      expect(fallback.tagName).not.toBe("IMG");
      expect(within(fallback).getByText(/foto tidak dapat dimuat/i)).toBeInTheDocument();
    });

    it("marks the active card", () => {
      const { container, rerender } = render(
        <ChapterV2 chapter={jakbar} index={2} active={false} onExplore={() => {}} />,
      );
      expect(container.querySelector(".v2-step")).not.toHaveClass("active");
      rerender(<ChapterV2 chapter={jakbar} index={2} active onExplore={() => {}} />);
      expect(container.querySelector(".v2-step")).toHaveClass("active");
    });
  });

  describe("outro", () => {
    it("offers a real call to action that opens explore mode", () => {
      const onExplore = vi.fn();
      render(
        <ChapterV2 chapter={chapters[byId("outro")]} index={6} active onExplore={onExplore} />,
      );
      fireEvent.click(screen.getByRole("button", { name: /jelajahi peta/i }));
      expect(onExplore).toHaveBeenCalledTimes(1);
    });
  });

  it("has no em dash in any chapter copy", () => {
    for (const c of chapters) {
      expect(`${c.title} ${c.subtitle ?? ""} ${c.body}`).not.toContain("—");
    }
  });
});
