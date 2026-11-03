import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Chapter from "../components/Chapter";
import type { Chapter as ChapterType } from "../lib/chapters";

const base: ChapterType = {
  id: "x",
  districtId: "jaksel",
  title: "Judul Tes",
  body: "Isi narasi tes.",
  image: "/images/x.jpg",
  view: { center: [106.8, -6.2], zoom: 11 },
};

describe("Chapter", () => {
  it("renders the title and body", () => {
    render(<Chapter chapter={base} />);
    expect(screen.getByText("Judul Tes")).toBeInTheDocument();
    expect(screen.getByText("Isi narasi tes.")).toBeInTheDocument();
  });

  it("renders an image with non-empty alt when image is set", () => {
    render(<Chapter chapter={base} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/x.jpg");
    expect((img.getAttribute("alt") ?? "").length).toBeGreaterThan(0);
  });

  it("renders no image when image is null", () => {
    render(<Chapter chapter={{ ...base, image: null }} />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});
