"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { basemapFromProcessEnv } from "@/lib/basemap";
import {
  districtFillPaint,
  landmarkFilter,
  buildingExtrusionPaint,
  cameraMove,
  cameraPadding,
  districtColorExpr,
  districtIdFilter,
  mapInteractive,
  type Mode,
} from "@/lib/mapLayers";
import type { MapView } from "@/lib/mapViews";

type Props = {
  activeDistrictId: string | null;
  view: MapView;
  mode: Mode;
  showAllLandmarks: boolean;
  reducedMotion: boolean;
};

// Explore shows every landmark (null filter); the story shows only the active
// district's.
function landmarksFilterFor(activeId: string | null, showAll: boolean) {
  return showAll ? null : landmarkFilter(activeId);
}

// MapTiler vector basemap when NEXT_PUBLIC_MAPTILER_KEY is set, keyless OSM
// raster otherwise — see lib/basemap.ts.
const BASEMAP = basemapFromProcessEnv();

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
    showAllLandmarks,
    reducedMotion,
  });
  propsRef.current = {
    activeDistrictId,
    view,
    mode,
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
    const outline = districtIdFilter(
      propsRef.current.activeDistrictId ?? hoverRef.current,
    );
    map.setFilter("districts-active", outline);
    map.setFilter("districts-glow", outline);
  }

  // Fly (or jump, under reduced motion) to the current view, keeping the subject
  // clear of the chapter card via padding.
  function moveCamera() {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const { view: v, mode: m, reducedMotion: rm } = propsRef.current;
    const opts = {
      center: v.center,
      zoom: v.zoom - (window.innerWidth <= 720 ? 0.8 : 0),
      pitch: v.pitch ?? 0,
      bearing: v.bearing ?? 0,
      padding: cameraPadding(window.innerWidth, window.innerHeight, m),
    };
    if (cameraMove(rm) === "flyTo") map.flyTo({ ...opts, duration: 2200, essential: true });
    else map.jumpTo(opts);
  }

  // Initialise the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP,
      center: view.center,
      zoom: view.zoom,
      maxPitch: 85,
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
      map.addSource("buildings", {
        type: "geojson",
        data: "/data/buildings.geojson",
      });

      // On a vector basemap, slot the story polygons beneath its first label layer
      // so street/place names stay readable; landmarks still go on top.
      const beforeLabels = map
        .getStyle()
        .layers?.find((l) => l.type === "symbol")?.id;

      map.addLayer({
        id: "districts-fill",
        type: "fill",
        source: "districts",
        paint: districtFillPaint(propsRef.current.activeDistrictId, null),
      }, beforeLabels);
      map.addLayer({
        id: "districts-line",
        type: "line",
        source: "districts",
        paint: { "line-color": "#ffffff", "line-width": 1.1, "line-opacity": 0.55 },
      }, beforeLabels);
      map.addLayer({
        id: "districts-glow",
        type: "line",
        source: "districts",
        filter: districtIdFilter(propsRef.current.activeDistrictId),
        paint: {
          "line-color": districtColorExpr(),
          "line-width": 12,
          "line-blur": 8,
          "line-opacity": 0.45,
        },
      }, beforeLabels);
      map.addLayer({
        id: "districts-active",
        type: "line",
        source: "districts",
        filter: districtIdFilter(propsRef.current.activeDistrictId),
        paint: { "line-color": "#ffffff", "line-width": 2.6 },
      }, beforeLabels);
      map.addLayer({
        id: "buildings",
        type: "fill-extrusion",
        source: "buildings",
        paint: buildingExtrusionPaint(),
      });
      map.addLayer({
        id: "landmarks",
        type: "circle",
        source: "landmarks",
        filter: landmarkFilter(propsRef.current.activeDistrictId),
        paint: {
          "circle-radius": 6,
          "circle-color": districtColorExpr("district"),
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
      moveCamera();
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
    moveCamera();
    paintDistricts();
    map.setFilter(
      "landmarks",
      landmarksFilterFor(activeDistrictId, showAllLandmarks),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDistrictId, view, mode, reducedMotion, showAllLandmarks]);

  // Enable free interaction only in explore mode.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    setInteraction(map, mapInteractive(mode));
  }, [mode]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
