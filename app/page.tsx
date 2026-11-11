import { readFileSync } from "node:fs";
import path from "node:path";
import StoryAppV2 from "@/components/v2/StoryAppV2";
import { chapters } from "@/lib/chapters";
import { computeHeroStats } from "@/lib/dataStats";

const readData = (name: string) =>
  JSON.parse(readFileSync(path.join(process.cwd(), "public", "data", name), "utf8"));

export default function Home() {
  // Computed at build time from the same GeoJSON the map loads, so the hero
  // numbers always match the data on screen.
  const stats = computeHeroStats(
    readData("jakarta-districts.geojson"),
    readData("landmarks.geojson"),
    chapters.reduce((n, c) => n + c.photos.length, 0),
  );

  return (
    <main>
      <StoryAppV2 stats={stats} />
    </main>
  );
}
