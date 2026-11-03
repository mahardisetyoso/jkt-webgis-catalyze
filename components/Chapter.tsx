import type { CSSProperties } from "react";
import type { Chapter as ChapterType } from "@/lib/chapters";

type Props = { chapter: ChapterType; index: number; active: boolean };

export default function Chapter({ chapter, index, active }: Props) {
  const isHero = chapter.id === "intro";
  const style = { "--c": chapter.color ?? "#f4a261" } as CSSProperties;
  const n = chapter.photos.length;

  return (
    <section
      className={`step${active ? " active" : ""}${isHero ? " hero" : ""}`}
      data-chapter-id={chapter.id}
    >
      <article className="chapter-card" style={style}>
        {n > 0 && (
          <div className={`photo n${n}`}>
            {chapter.photos.map((p) => (
              <figure key={p.src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.caption}
                  loading="lazy"
                  style={{ objectPosition: p.position ?? "center" }}
                />
                <figcaption aria-hidden="true">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        )}
        <div className="card-body">
          {chapter.theme && (
            <div className="kicker">
              {String(index).padStart(2, "0")} · {chapter.theme}
            </div>
          )}
          <h2>{chapter.title}</h2>
          {chapter.subtitle && <p className="subtitle">{chapter.subtitle}</p>}
          <p>{chapter.body}</p>
        </div>
      </article>
    </section>
  );
}
