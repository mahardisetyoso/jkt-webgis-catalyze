import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ModeNav from "../components/ModeNav";

describe("ModeNav", () => {
  it("renders the three modes and marks the active one", () => {
    render(<ModeNav view="gallery" onChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Cerita" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Galeri" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Jelajahi" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Galeri" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("calls onChange with the clicked mode", () => {
    const onChange = vi.fn();
    render(<ModeNav view="story" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Galeri" }));
    expect(onChange).toHaveBeenCalledWith("gallery");
  });
});
