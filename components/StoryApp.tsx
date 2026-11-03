"use client";

import { useEffect, useState } from "react";
import MapCanvas from "./MapCanvas";
import Scroller from "./Scroller";
import ExplorePanel from "./ExplorePanel";
import { chapters } from "@/lib/chapters";
import { mapViews } from "@/lib/mapViews";

type ExploreLayers = { landmarks: boolean; congestion: boolean };

export default function StoryApp() {
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"story" | "explore">("story");
  const [reduced, setReduced] = useState(false);
  const [layers, setLayers] = useState<ExploreLayers>({
    landmarks: true,
    congestion: true,
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Explore mode removes the scroll column, so return the viewport to the top.
  useEffect(() => {
    if (mode === "explore") window.scrollTo(0, 0);
  }, [mode]);

  const chapter = chapters[active] ?? chapters[0];
  const isExplore = mode === "explore";

  const mapProps = isExplore
    ? {
        activeDistrictId: null,
        view: mapViews.overview,
        mode,
        showCongestion: layers.congestion,
        showAllLandmarks: layers.landmarks,
        reducedMotion: reduced,
      }
    : {
        activeDistrictId: chapter.districtId,
        view: chapter.view,
        mode,
        showCongestion: chapter.congestion === true,
        showAllLandmarks: false,
        reducedMotion: reduced,
      };

  return (
    <>
      <div className="map-sticky">
        <MapCanvas {...mapProps} />
      </div>

      {!isExplore && (
        <>
          <Scroller chapters={chapters} onChapter={setActive} />
          {chapter.id === "outro" && (
            <div className="explore-cta">
              <button type="button" onClick={() => setMode("explore")}>
                Jelajahi peta ↗
              </button>
            </div>
          )}
        </>
      )}

      {isExplore && (
        <div className="explore-overlay">
          <ExplorePanel
            layers={[
              { id: "landmarks", label: "Penanda lokasi", visible: layers.landmarks },
              {
                id: "congestion",
                label: "Kemacetan Sudirman",
                visible: layers.congestion,
              },
            ]}
            onToggle={(id) =>
              setLayers((s) => ({ ...s, [id]: !s[id as keyof ExploreLayers] }))
            }
          />
          <button
            type="button"
            className="back-btn"
            onClick={() => setMode("story")}
          >
            ← Kembali ke cerita
          </button>
        </div>
      )}
    </>
  );
}
