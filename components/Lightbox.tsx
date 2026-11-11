"use client";

import { useEffect, useRef, type CSSProperties } from "react";
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Move focus into the dialog on open and give it back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndex((index + 1) % n);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + n) % n);
      else if (e.key === "Tab") {
        // Keep Tab and Shift+Tab inside the dialog.
        const buttons = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>("button") ?? [],
        );
        if (buttons.length === 0) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        } else if (!dialogRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, n, onClose, onIndex]);

  if (!item) return null;

  return (
    <div
      ref={dialogRef}
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
      <button
        ref={closeRef}
        type="button"
        className="lb-btn lb-close"
        aria-label="Tutup"
        onClick={onClose}
      >
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
