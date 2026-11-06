"use client";

import { useEffect, useState } from "react";
import MapCanvas from "../MapCanvas";
import ScrollerV2 from "./ScrollerV2";
import NavV2 from "./NavV2";
import ExplorePanel from "../ExplorePanel";
import GalleryGrid, { type GalleryItem } from "../GalleryGrid";
import Lightbox from "../Lightbox";
import type { ViewMode } from "../ModeNav";
import { chapters } from "@/lib/chapters";
import { mapViews } from "@/lib/mapViews";

type ExploreLayers = { landmarks: boolean };

const galleryItems: GalleryItem[] = chapters.flatMap((c) =>
  c.photos.map((p) => ({
    src: p.src,
    caption: p.caption,
    district: c.districtId ?? "",
    color: c.color ?? "#E0A458",
  })),
);

export default function StoryAppV2() {
  const [active, setActive] = useState(0);
  const [view, setView] = useState<ViewMode>("story");
  const [reduced, setReduced] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [layers, setLayers] = useState<ExploreLayers>({ landmarks: true });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    if (view !== "story") window.scrollTo(0, 0);
    if (view !== "gallery") setLightbox(null);
  }, [view]);

  const chapter = chapters[active] ?? chapters[0];
  const isStory = view === "story";
  const isGallery = view === "gallery";
  const isExplore = view === "explore";
  const mapMode: "story" | "explore" = isExplore ? "explore" : "story";

  const mapProps = isExplore
    ? {
        activeDistrictId: null,
        view: mapViews.overview,
        mode: mapMode,
        showAllLandmarks: layers.landmarks,
        reducedMotion: reduced,
      }
    : {
        activeDistrictId: chapter.districtId,
        view: chapter.view,
        mode: mapMode,
        showAllLandmarks: false,
        reducedMotion: reduced,
      };

  return (
    <>
      <NavV2 view={view} onChange={setView} />

      <div className="v2-map">
        <MapCanvas {...mapProps} />
      </div>

      {isStory && (
        <>
          <div className="v2-dots" role="tablist" aria-label="Bab">
            {chapters.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={`v2-dot-btn${i === active ? " active" : ""}`}
                style={{ "--c": c.color ?? "#E0A458" } as React.CSSProperties}
                aria-label={c.title}
                aria-current={i === active ? "true" : undefined}
                onClick={() =>
                  document
                    .querySelectorAll(".v2-step")
                    [i]?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" })
                }
              />
            ))}
          </div>
          <ScrollerV2
            chapters={chapters}
            onChapter={setActive}
            active={active}
            onExplore={() => setView("explore")}
          />
        </>
      )}

      {isExplore && (
        <div className="v2-overlay v2-explore">
          <ExplorePanel
            layers={[{ id: "landmarks", label: "Penanda lokasi", visible: layers.landmarks }]}
            onToggle={(id) => setLayers((s) => ({ ...s, [id]: !s[id as keyof ExploreLayers] }))}
          />
          <button type="button" className="v2-back-btn" onClick={() => setView("story")}>
            ← Kembali ke cerita
          </button>
        </div>
      )}

      {isGallery && (
        <div className="v2-overlay v2-gallery">
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
