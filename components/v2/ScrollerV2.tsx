"use client";

import { useEffect, useRef } from "react";
import scrollama from "scrollama";
import ChapterV2 from "./ChapterV2";
import type { Chapter as ChapterType } from "@/lib/chapters";
import type { HeroStats } from "@/lib/dataStats";

type Props = {
  chapters: ChapterType[];
  onChapter: (index: number) => void;
  active?: number;
  onExplore: () => void;
  stats?: HeroStats;
};

export default function ScrollerV2({ chapters, onChapter, active = 0, onExplore, stats }: Props) {
  const cbRef = useRef(onChapter);
  cbRef.current = onChapter;

  useEffect(() => {
    const scroller = scrollama();
    scroller
      .setup({ step: ".v2-step", offset: 0.6 })
      .onStepEnter((response) => cbRef.current(response.index));

    const onResize = () => scroller.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      scroller.destroy();
    };
  }, []);

  return (
    <div className="v2-scroller">
      {chapters.map((chapter, i) => (
        <ChapterV2
          key={chapter.id}
          chapter={chapter}
          index={i}
          active={i === active}
          onExplore={onExplore}
          stats={stats}
        />
      ))}
    </div>
  );
}
