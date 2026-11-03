import type { CSSProperties } from "react";

export type GalleryItem = {
  src: string;
  caption: string;
  district: string;
  color: string;
};

export default function GalleryGrid({
  items,
  onOpen,
}: {
  items: GalleryItem[];
  onOpen: (index: number) => void;
}) {
  return (
    <div className="gallery-grid">
      {items.map((item, i) => (
        <button
          key={`${item.src}-${i}`}
          type="button"
          className="gallery-tile"
          style={{ "--c": item.color } as CSSProperties}
          onClick={() => onOpen(i)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.src} alt={item.caption} loading="lazy" />
          <span className="gallery-caption">{item.caption}</span>
        </button>
      ))}
    </div>
  );
}
