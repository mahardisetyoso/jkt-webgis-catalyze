import type { Chapter as ChapterType } from "@/lib/chapters";

export default function Chapter({ chapter }: { chapter: ChapterType }) {
  return (
    <section className="step" data-chapter-id={chapter.id}>
      <div className="chapter-card">
        <h2>{chapter.title}</h2>
        <p>{chapter.body}</p>
        {chapter.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={chapter.image} alt={chapter.title} className="chapter-image" />
        )}
      </div>
    </section>
  );
}
