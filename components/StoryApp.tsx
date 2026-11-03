"use client";

import { useEffect, useState } from "react";
import MapCanvas from "./MapCanvas";
import Scroller from "./Scroller";
import ExplorePanel from "./ExplorePanel";
import ChapterDots from "./ChapterDots";
import ModeNav, { type ViewMode } from "./ModeNav";
import GalleryGrid, { type GalleryItem } from "./GalleryGrid";
import Lightbox from "./Lightbox";
import { chapters } from "@/lib/chapters";
import { mapViews } from "@/lib/mapViews";

type ExploreLayers = { landmarks: boolean; congestion: boolean };

// All chapter photos flattened into gallery items (static — chapters never change).
const galleryItems: GalleryItem[] = chapters.flatMap((c) =>
  c.photos.map((p) => ({
    src: p.src,
    caption: p.caption,
    district: c.districtId ?? "",
    color: c.color ?? "#8a99ad",
  })),
);

export default function StoryApp() {
  const [active, setActive] = useState(0);
  const [view, setView] = useState<ViewMode>("story");
  const [reduced, setReduced] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
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

  // Gallery and explore are full overlays; reset scroll and any open lightbox.
  useEffect(() => {
    if (view !== "story") window.scrollTo(0, 0);
    if (view !== "gallery") setLightbox(null);
  }, [view]);

  const chapter = chapters[active] ?? chapters[0];
  const isStory = view === "story";
  const isGallery = view === "gallery";
  const isExplore = view === "explore";
  const mapMode = isExplore ? "explore" : "story";

  const mapProps = isExplore
    ? {
        activeDistrictId: null,
        view: mapViews.overview,
        mode: mapMode,
        showCongestion: layers.congestion,
        showAllLandmarks: layers.landmarks,
        reducedMotion: reduced,
      }
    : {
        activeDistrictId: chapter.districtId,
        view: chapter.view,
        mode: mapMode,
        showCongestion: chapter.congestion === true,
        showAllLandmarks: false,
        reducedMotion: reduced,
      };

  return (
    <>
      <ModeNav view={view} onChange={setView} />

      <div className="map-sticky">
        <MapCanvas {...mapProps} />
      </div>

      {isStory && (
        <>
          <ChapterDots
            chapters={chapters}
            active={active}
            onSelect={(i) =>
              document
                .querySelectorAll(".step")
                [i]?.scrollIntoView({
                  behavior: reduced ? "auto" : "smooth",
                  block: "center",
                })
            }
          />
          <Scroller chapters={chapters} onChapter={setActive} active={active} />
          {chapter.id === "outro" && (
            <div className="explore-cta">
              <button type="button" onClick={() => setView("explore")}>
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
          <button type="button" className="back-btn" onClick={() => setView("story")}>
            ← Kembali ke cerita
          </button>
        </div>
      )}

      {isGallery && (
        <div className="gallery-overlay">
          <GalleryGrid items={galleryItems} onOpen={setLightbox} />
          {lightbox !== null && (
            <Lightbox
              items={galleryItems}
              index={lightbox}
              onClose={() => setLightbox(null)}
              onIndex={setLightbox}
            />
          )}
        </div>
      )}
    </>
  );
}
