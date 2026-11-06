"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Chapter as ChapterType } from "@/lib/chapters";

type Props = {
  chapter: ChapterType;
  index: number;
  active: boolean;
  onExplore: () => void;
};

const PATHS: Record<string, string> = {
  down: "M12 5v14M19 12l-7 7-7-7",
  compass: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.5 8.5l-1.8 5.2-5.2 1.8 1.8-5.2 5.2-1.8Z",
  db: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3ZM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
};
function Icon({ n }: { n: keyof typeof PATHS | string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[n]} />
    </svg>
  );
}

const STATS = [
  { to: 5, label: "Kota administrasi" },
  { to: 44, label: "Kecamatan" },
  { to: 267, label: "Kelurahan" },
  { to: 662, label: "Luas daratan", unit: "km²" },
];

function CountUp({ to, unit }: { to: number; unit?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVal(to); return; }
    let raf = 0;
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(node);
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / 1100);
          setVal(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return (
    <div className="v2-num" ref={ref}>
      {val}
      {unit && <span className="v2-unit">{unit}</span>}
    </div>
  );
}

export default function ChapterV2({ chapter, index, active, onExplore }: Props) {
  const isHero = chapter.id === "intro";
  const isOutro = chapter.id === "outro";
  const style = { "--c": chapter.color ?? "#E0A458" } as CSSProperties;
  const n = chapter.photos.length;

  return (
    <section
      className={`v2-step${active ? " active" : ""}${isHero ? " hero" : ""}${isOutro ? " outro" : ""}`}
      data-chapter-id={chapter.id}
    >
      <article className="v2-card" style={style}>
        {isHero ? (
          <>
            <div className="v2-eyebrow"><span className="v2-bar" />WebGIS storytelling · 5 kota administrasi</div>
            <h1 className="v2-h1">Jakarta</h1>
            <p className="v2-sub">Lima wajah, satu kota</p>
            <p className="v2-body">{chapter.body}</p>
            <div className="v2-stats">
              {STATS.map((s) => (
                <div className="v2-tile" key={s.label}>
                  <CountUp to={s.to} unit={s.unit} />
                  <div className="v2-tile-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="v2-stats-src"><Icon n="db" /> Agregat atribut layer — bukan data baru</div>
          </>
        ) : isOutro ? (
          <>
            <div className="v2-eyebrow"><span className="v2-bar" />Penutup</div>
            <h2 className="v2-title">{chapter.title}</h2>
            {chapter.subtitle && <p className="v2-sub">{chapter.subtitle}</p>}
            <p className="v2-body">{chapter.body}</p>
            <div className="v2-actions">
              <button type="button" className="v2-btn v2-btn-primary" onClick={onExplore}>
                <Icon n="compass" /> Jelajahi peta
              </button>
            </div>
          </>
        ) : (
          <>
            {chapter.theme && (
              <div className="v2-kicker">
                <span className="v2-idx">{String(index).padStart(2, "0")}</span>
                <span className="v2-badge"><span className="v2-sw" />{chapter.theme}</span>
              </div>
            )}
            <h2 className="v2-title">{chapter.title}</h2>
            {chapter.subtitle && <p className="v2-sub">{chapter.subtitle}</p>}
            {n > 0 && (
              <div className={`v2-photo n${n}`}>
                {chapter.photos.map((p) => (
                  <figure key={p.src}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={p.caption} loading="lazy" style={{ objectPosition: p.position ?? "center" }} />
                    <figcaption aria-hidden="true">{p.caption}</figcaption>
                  </figure>
                ))}
              </div>
            )}
            <p className="v2-body">{chapter.body}</p>
          </>
        )}
      </article>
      {isHero && <div className="v2-cue"><Icon n="down" /> Scroll untuk memulai</div>}
    </section>
  );
}
