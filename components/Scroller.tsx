"use client";

import { useEffect, useRef } from "react";
import scrollama from "scrollama";
import Chapter from "./Chapter";
import type { Chapter as ChapterType } from "@/lib/chapters";

type Props = {
  chapters: ChapterType[];
  onChapter: (index: number) => void;
  active?: number;
};

export default function Scroller({ chapters, onChapter, active = 0 }: Props) {
  const cbRef = useRef(onChapter);
  cbRef.current = onChapter;

  useEffect(() => {
    const scroller = scrollama();
    scroller
      .setup({ step: ".step", offset: 0.6 })
      .onStepEnter((response) => cbRef.current(response.index));

    const onResize = () => scroller.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      scroller.destroy();
    };
  }, []);

  return (
    <div className="scroller">
      {chapters.map((chapter, i) => (
        <Chapter key={chapter.id} chapter={chapter} index={i} active={i === active} />
      ))}
    </div>
  );
}
