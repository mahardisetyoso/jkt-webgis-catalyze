"use client";

import { useEffect, type CSSProperties } from "react";
import type { GalleryItem } from "./GalleryGrid";

export default function Lightbox({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onIndex: (index: number) => void;
}) {
  const n = items.length;
  const item = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndex((index + 1) % n);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, n, onClose, onIndex]);

  if (!item) return null;

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.caption}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <figure className="lightbox-content" style={{ "--c": item.color } as CSSProperties}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={item.caption} />
        <figcaption>{item.caption}</figcaption>
      </figure>
      <button type="button" className="lb-btn lb-close" aria-label="Tutup" onClick={onClose}>
        ×
      </button>
      <button
        type="button"
        className="lb-btn lb-prev"
        aria-label="Sebelumnya"
        onClick={() => onIndex((index - 1 + n) % n)}
      >
        ‹
      </button>
      <button
        type="button"
        className="lb-btn lb-next"
        aria-label="Berikutnya"
        onClick={() => onIndex((index + 1) % n)}
      >
        ›
      </button>
    </div>
  );
}
