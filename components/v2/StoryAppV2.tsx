"use client";

import { useEffect, useState } from "react";
import MapCanvas, { type MapStatus } from "../MapCanvas";
import ScrollerV2 from "./ScrollerV2";
import NavV2 from "./NavV2";
import ExplorePanel from "../ExplorePanel";
import GalleryGrid, { type GalleryItem } from "../GalleryGrid";
import Lightbox from "../Lightbox";
import type { ViewMode } from "../ModeNav";
import { chapters } from "@/lib/chapters";
import { mapViews } from "@/lib/mapViews";
import type { HeroStats } from "@/lib/dataStats";

type ExploreLayers = { landmarks: boolean };

const galleryItems: GalleryItem[] = chapters.flatMap((c) =>
  c.photos.map((p) => ({
    src: p.src,
    caption: p.caption,
    district: c.districtId ?? "",
    color: c.color ?? "#E0A458",
  })),
);

export default function StoryAppV2({ stats }: { stats?: HeroStats }) {
  const [active, setActive] = useState(0);
  const [view, setView] = useState<ViewMode>("story");
  const [reduced, setReduced] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [layers, setLayers] = useState<ExploreLayers>({ landmarks: true });
  const [mapStatus, setMapStatus] = useState<MapStatus>("loading");

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
        <MapCanvas {...mapProps} onStatus={setMapStatus} />
      </div>

      {mapStatus === "loading" && (
        <div className="v2-map-status" role="status">
          <span className="v2-skeleton" aria-hidden="true" />
          Memuat peta
        </div>
      )}
      {mapStatus === "error" && (
        <div className="v2-map-status v2-map-error" role="alert">
          <p>Peta gagal dimuat. Periksa koneksi internetmu, lalu muat ulang halaman.</p>
          <button type="button" className="v2-btn v2-btn-primary" onClick={() => window.location.reload()}>
            Muat ulang
          </button>
        </div>
      )}

      {isStory && (
        <>
          <nav className="v2-dots" aria-label="Bab">
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
          </nav>
          <ScrollerV2
            chapters={chapters}
            onChapter={setActive}
            active={active}
            onExplore={() => setView("explore")}
            stats={stats}
          />
        </>
      )}

      {isExplore && (
        <div className="v2-overlay v2-explore">
          <h1 className="v2-sr-only">Jelajahi peta</h1>
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
          <div className="v2-gallery-head">
            <div className="v2-eyebrow"><span className="v2-bar" />Galeri</div>
            <h1 className="v2-gallery-title">Landmark lima kota</h1>
            <p className="v2-gallery-sub">
              {galleryItems.length > 0
                ? `${galleryItems.length} foto, klik untuk memperbesar`
                : "Belum ada foto untuk ditampilkan."}
            </p>
          </div>
          {galleryItems.length > 0 ? (
            <GalleryGrid items={galleryItems} onOpen={setLightbox} />
          ) : (
            <div className="v2-empty" role="status">
              Foto landmark akan muncul di sini setelah ditambahkan ke setiap bab.
            </div>
          )}
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
