import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { mapViews } from "../lib/mapViews";

// A fake MapLibre map: records camera calls and lets the test fire "load".
// Defined in vi.hoisted because vi.mock factories are hoisted above imports.
const { FakeMap, FakePopup, instances } = vi.hoisted(() => {
  type Handler = (...a: unknown[]) => void;
  const instances: any[] = [];

class FakeMap {
  handlers: Record<string, Handler[]> = {};
  flyTo = vi.fn();
  jumpTo = vi.fn();
  constructor(public opts: Record<string, unknown>) {
    instances.push(this);
  }
  on(event: string, a: unknown, b?: unknown) {
    const cb = (typeof a === "function" ? a : b) as Handler;
    (this.handlers[event] ??= []).push(cb);
    return this;
  }
  fire(event: string, arg?: unknown) {
    for (const cb of this.handlers[event] ?? []) cb(arg);
  }
  addSource() {}
  addLayer() {}
  getStyle() {
    return { layers: [] };
  }
  setPaintProperty() {}
  setFilter() {}
  setLayoutProperty() {}
  getLayoutProperty() {
    return "none";
  }
  getCanvas() {
    return { style: {} };
  }
  remove() {}
  private handler = { enable: vi.fn(), disable: vi.fn() };
  dragPan = this.handler;
  scrollZoom = this.handler;
  boxZoom = this.handler;
  doubleClickZoom = this.handler;
  touchZoomRotate = this.handler;
  keyboard = this.handler;
  dragRotate = this.handler;
}
class FakePopup {
  setLngLat() {
    return this;
  }
  setText() {
    return this;
  }
  addTo() {
    return this;
  }
  remove() {}
}

  return { FakeMap, FakePopup, instances };
});

vi.mock("maplibre-gl", () => ({
  default: { Map: FakeMap, Popup: FakePopup },
}));

import MapCanvas from "../components/MapCanvas";

const base = {
  mode: "story" as const,
  showAllLandmarks: false,
  reducedMotion: false,
};

describe("MapCanvas camera", () => {
  beforeEach(() => {
    instances.length = 0;
  });

  // Regression: scrolling to a chapter before the map finished loading (e.g.
  // scroll restoration on refresh, slow dev server) left the camera on the
  // overview while the chapter's district was highlighted.
  it("flies to the current chapter's view once the map loads", () => {
    const { rerender } = render(
      <MapCanvas {...base} activeDistrictId={null} view={mapViews.overview} />,
    );
    // User reaches Jakarta Pusat while the map is still loading.
    rerender(<MapCanvas {...base} activeDistrictId="jakpus" view={mapViews.jakpus} />);
    const map = instances[instances.length - 1];
    expect(map.flyTo).not.toHaveBeenCalled();

    map.fire("load");

    expect(map.flyTo).toHaveBeenCalled();
    const opts = map.flyTo.mock.calls.at(-1)![0];
    expect(opts.center).toEqual(mapViews.jakpus.center);
    expect(opts.pitch).toBe(mapViews.jakpus.pitch);
    expect(opts.padding.left).toBeGreaterThan(0);
  });

  it("flies on chapter change after load, and jumps under reduced motion", () => {
    const { rerender } = render(
      <MapCanvas {...base} activeDistrictId={null} view={mapViews.overview} />,
    );
    const map = instances[instances.length - 1];
    map.fire("load");
    rerender(<MapCanvas {...base} activeDistrictId="jaksel" view={mapViews.jaksel} />);
    expect(map.flyTo.mock.calls.at(-1)![0].center).toEqual(mapViews.jaksel.center);

    rerender(
      <MapCanvas {...base} reducedMotion activeDistrictId="jakut" view={mapViews.jakut} />,
    );
    expect(map.jumpTo.mock.calls.at(-1)![0].center).toEqual(mapViews.jakut.center);
  });
});

describe("MapCanvas status", () => {
  beforeEach(() => {
    instances.length = 0;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  const mount = (onStatus: (s: string) => void) => {
    render(
      <MapCanvas {...base} activeDistrictId={null} view={mapViews.overview} onStatus={onStatus} />,
    );
    return instances[instances.length - 1];
  };

  it("reports ready once the map has loaded", () => {
    const onStatus = vi.fn();
    mount(onStatus).fire("load");
    expect(onStatus).toHaveBeenCalledWith("ready");
  });

  it("reports an error when the style never arrives before load", () => {
    const onStatus = vi.fn();
    mount(onStatus).fire("error", { error: new Error("Failed to fetch") });
    expect(onStatus).toHaveBeenCalledWith("error");
  });

  it("reports an error when the essential district data fails", () => {
    const onStatus = vi.fn();
    const map = mount(onStatus);
    map.fire("load");
    map.fire("error", { sourceId: "districts", error: new Error("404") });
    expect(onStatus).toHaveBeenLastCalledWith("error");
  });

  it("ignores a basemap tile miss after load", () => {
    const onStatus = vi.fn();
    const map = mount(onStatus);
    map.fire("load");
    map.fire("error", { sourceId: "basemap", error: new Error("tile 404") });
    expect(onStatus).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenCalledWith("ready");
  });

  it("reports an error if the map never finishes loading", () => {
    vi.useFakeTimers();
    const onStatus = vi.fn();
    mount(onStatus);
    vi.advanceTimersByTime(20001);
    expect(onStatus).toHaveBeenCalledWith("error");
    vi.useRealTimers();
  });
});
