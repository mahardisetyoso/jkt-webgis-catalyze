import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Lightbox from "../components/Lightbox";

const items = [
  { src: "/a.jpg", caption: "A", district: "jakpus", color: "#f00" },
  { src: "/b.jpg", caption: "B", district: "jakbar", color: "#0f0" },
  { src: "/c.jpg", caption: "C", district: "jaksel", color: "#00f" },
];

describe("Lightbox", () => {
  it("shows the selected photo with its caption", () => {
    render(<Lightbox items={items} index={1} onClose={() => {}} onIndex={() => {}} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/b.jpg");
    expect(img).toHaveAttribute("alt", "B");
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("advances to the next photo, wrapping at the end", () => {
    const onIndex = vi.fn();
    render(<Lightbox items={items} index={2} onClose={() => {}} onIndex={onIndex} />);
    fireEvent.click(screen.getByRole("button", { name: /berikutnya/i }));
    expect(onIndex).toHaveBeenCalledWith(0);
  });

  it("goes to the previous photo, wrapping at the start", () => {
    const onIndex = vi.fn();
    render(<Lightbox items={items} index={0} onClose={() => {}} onIndex={onIndex} />);
    fireEvent.click(screen.getByRole("button", { name: /sebelumnya/i }));
    expect(onIndex).toHaveBeenCalledWith(2);
  });

  it("closes from the close button", () => {
    const onClose = vi.fn();
    render(<Lightbox items={items} index={0} onClose={onClose} onIndex={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /tutup/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
