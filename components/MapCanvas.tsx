"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import {
  districtFillPaint,
  landmarkFilter,
  congestionPaint,
  cameraMove,
  mapInteractive,
  type Mode,
} from "@/lib/mapLayers";
import type { MapView } from "@/lib/mapViews";

type Props = {
  activeDistrictId: string | null;
  view: MapView;
  mode: Mode;
  showCongestion: boolean;
  showAllLandmarks: boolean;
  reducedMotion: boolean;
};

// Explore shows every landmark (null filter); the story shows only the active
// district's.
function landmarksFilterFor(activeId: string | null, showAll: boolean) {
  return showAll ? null : landmarkFilter(activeId);
}

// Keyless OpenStreetMap raster tiles for the POC. A production build should use a
// keyed vector-tile provider (e.g. MapTiler) — see docs/architecture.md.
const BASEMAP: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const HANDLER_KEYS = [
  "dragPan",
  "scrollZoom",
  "boxZoom",
  "doubleClickZoom",
  "touchZoomRotate",
  "keyboard",
  "dragRotate",
] as const;

function setInteraction(map: maplibregl.Map, on: boolean) {
  for (const key of HANDLER_KEYS) {
    const handler = map[key];
    if (on) handler.enable();
    else handler.disable();
  }
}

export default function MapCanvas({
  activeDistrictId,
  view,
  mode,
  showCongestion,
  showAllLandmarks,
  reducedMotion,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const readyRef = useRef(false);
  const hoverRef = useRef<string | null>(null);
  const propsRef = useRef<Props>({
    activeDistrictId,
    view,
    mode,
    showCongestion,
    showAllLandmarks,
    reducedMotion,
  });
  propsRef.current = {
    activeDistrictId,
    view,
    mode,
    showCongestion,
    showAllLandmarks,
    reducedMotion,
  };

  function paintDistricts() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const op = districtFillPaint(
      propsRef.current.activeDistrictId,
      hoverRef.current,
    )["fill-opacity"];
    map.setPaintProperty("districts-fill", "fill-opacity", op);
  }

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP,
      center: view.center,
      zoom: view.zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
    });

    map.on("error", (e) =>
      console.warn("[MapCanvas] map error:", e?.error?.message ?? e),
    );

    map.on("load", () => {
      map.addSource("districts", {
        type: "geojson",
        data: "/data/jakarta-districts.geojson",
      });
      map.addSource("landmarks", {
        type: "geojson",
        data: "/data/landmarks.geojson",
      });
      map.addSource("congestion", {
        type: "geojson",
        data: "/data/congestion.geojson",
      });

      map.addLayer({
        id: "districts-fill",
        type: "fill",
        source: "districts",
        paint: districtFillPaint(propsRef.current.activeDistrictId, null),
      });
      map.addLayer({
        id: "districts-line",
        type: "line",
        source: "districts",
        paint: { "line-color": "#1565c0", "line-width": 1.2, "line-opacity": 0.85 },
      });
      map.addLayer({
        id: "congestion",
        type: "fill",
        source: "congestion",
        layout: {
          visibility: propsRef.current.showCongestion ? "visible" : "none",
        },
        paint: congestionPaint(),
      });
      map.addLayer({
        id: "landmarks",
        type: "circle",
        source: "landmarks",
        filter: landmarkFilter(propsRef.current.activeDistrictId),
        paint: {
          "circle-radius": 6,
          "circle-color": "#ff7043",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      map.on("mousemove", "districts-fill", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        map.getCanvas().style.cursor = "pointer";
        hoverRef.current = feature.properties?.id
          ? String(feature.properties.id)
          : null;
        paintDistricts();
        popupRef.current
          ?.setLngLat(e.lngLat)
          .setText(String(feature.properties?.name ?? ""))
          .addTo(map);
      });
      map.on("mouseleave", "districts-fill", () => {
        map.getCanvas().style.cursor = "";
        hoverRef.current = null;
        paintDistricts();
        popupRef.current?.remove();
      });

      readyRef.current = true;
      paintDistricts();
      map.setFilter(
        "landmarks",
        landmarksFilterFor(
          propsRef.current.activeDistrictId,
          propsRef.current.showAllLandmarks,
        ),
      );
      setInteraction(map, mapInteractive(propsRef.current.mode));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Camera move + active-district highlight. flyTo cancels any prior animation,
  // so rapid chapter changes settle on the latest view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const opts = { center: view.center, zoom: view.zoom };
    if (cameraMove(reducedMotion) === "flyTo") map.flyTo(opts);
    else map.jumpTo(opts);
    paintDistricts();
    map.setFilter(
      "landmarks",
      landmarksFilterFor(activeDistrictId, showAllLandmarks),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDistrictId, view, reducedMotion, showAllLandmarks]);

  // Congestion overlay toggle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setLayoutProperty(
      "congestion",
      "visibility",
      showCongestion ? "visible" : "none",
    );
  }, [showCongestion]);

  // Enable free interaction only in explore mode.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    setInteraction(map, mapInteractive(mode));
  }, [mode]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
