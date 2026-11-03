import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GalleryGrid from "../components/GalleryGrid";

const items = [
  { src: "/images/photos/scbd.jpg", caption: "SCBD", district: "jakpus", color: "#f4a261" },
  { src: "/images/photos/trisakti.jpg", caption: "Universitas Trisakti", district: "jakbar", color: "#2ec4b6" },
];

describe("GalleryGrid", () => {
  it("renders one tile per photo with the caption as alt text", () => {
    render(<GalleryGrid items={items} onOpen={() => {}} />);
    const imgs = screen.getAllByRole("img");
    expect(imgs).toHaveLength(2);
    expect(imgs[0]).toHaveAttribute("alt", "SCBD");
  });

  it("calls onOpen with the tile index when a tile is clicked", () => {
    const onOpen = vi.fn();
    render(<GalleryGrid items={items} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole("button", { name: /Universitas Trisakti/i }));
    expect(onOpen).toHaveBeenCalledWith(1);
  });
});
