import StoryApp from "@/components/StoryApp";

export default function Home() {
  return (
    <main>
      <header className="app-header">
        <span className="brand">Jakarta · Lima Wajah Satu Kota</span>
        <span className="tagline">WebGIS storytelling · 5 kota administrasi</span>
      </header>
      <StoryApp />
    </main>
  );
}
