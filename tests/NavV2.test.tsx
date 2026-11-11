import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NavV2 from "../components/v2/NavV2";

describe("NavV2", () => {
  it("renders the three modes and marks the active one", () => {
    render(<NavV2 view="gallery" onChange={() => {}} />);
    for (const name of ["Cerita", "Galeri", "Jelajah"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: "Galeri" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: "Cerita" })).not.toHaveAttribute("aria-current");
  });

  it("reports the chosen mode", () => {
    const onChange = vi.fn();
    render(<NavV2 view="story" onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Jelajah" }));
    expect(onChange).toHaveBeenCalledWith("explore");
  });

  it("is a labelled navigation landmark", () => {
    render(<NavV2 view="story" onChange={() => {}} />);
    expect(screen.getByRole("navigation", { name: "Mode" })).toBeInTheDocument();
  });
});
