import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Chapter from "../components/Chapter";
import type { Chapter as ChapterType } from "../lib/chapters";

const base: ChapterType = {
  id: "x",
  districtId: "jaksel",
  title: "Judul Tes",
  subtitle: "Sub tes",
  theme: "Tema Tes",
  color: "#c77dff",
  body: "Isi narasi tes.",
  photos: [{ src: "/images/photos/x.jpg", caption: "Foto X" }],
  view: { center: [106.8, -6.2], zoom: 11 },
};

describe("Chapter", () => {
  it("renders the title, subtitle, theme and body", () => {
    render(<Chapter chapter={base} index={1} active={false} />);
    expect(screen.getByRole("heading", { name: "Judul Tes" })).toBeInTheDocument();
    expect(screen.getByText("Sub tes")).toBeInTheDocument();
    expect(screen.getByText(/Tema Tes/)).toBeInTheDocument();
    expect(screen.getByText("Isi narasi tes.")).toBeInTheDocument();
  });

  it("renders each photo with its caption as alt text", () => {
    render(<Chapter chapter={base} index={1} active={false} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/photos/x.jpg");
    expect(img).toHaveAttribute("alt", "Foto X");
  });

  it("renders two photos side by side when given two", () => {
    const two = {
      ...base,
      photos: [
        { src: "/a.jpg", caption: "A" },
        { src: "/b.jpg", caption: "B" },
      ],
    };
    const { container } = render(<Chapter chapter={two} index={1} active={false} />);
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(container.querySelector(".photo.n2")).not.toBeNull();
  });

  it("renders no image when photos is empty", () => {
    render(<Chapter chapter={{ ...base, photos: [] }} index={1} active={false} />);
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("marks the active chapter", () => {
    const { container } = render(<Chapter chapter={base} index={1} active />);
    expect(container.querySelector(".step.active")).not.toBeNull();
  });
});
