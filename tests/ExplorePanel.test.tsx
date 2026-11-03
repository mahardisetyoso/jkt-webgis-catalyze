import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExplorePanel from "../components/ExplorePanel";

const layers = [
  { id: "landmarks", label: "Penanda lokasi", visible: true },
  { id: "congestion", label: "Kemacetan Sudirman", visible: false },
];

describe("ExplorePanel", () => {
  it("renders one toggle per layer", () => {
    render(<ExplorePanel layers={layers} onToggle={() => {}} />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(layers.length);
  });

  it("calls onToggle with the layer id when a toggle is clicked", () => {
    const onToggle = vi.fn();
    render(<ExplorePanel layers={layers} onToggle={onToggle} />);
    fireEvent.click(screen.getByLabelText("Penanda lokasi"));
    expect(onToggle).toHaveBeenCalledWith("landmarks");
  });
});
