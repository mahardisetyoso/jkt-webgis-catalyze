export type ViewMode = "story" | "gallery" | "explore";

const MODES: { id: ViewMode; label: string }[] = [
  { id: "story", label: "Cerita" },
  { id: "gallery", label: "Galeri" },
  { id: "explore", label: "Jelajahi" },
];

export default function ModeNav({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <nav className="mode-nav" aria-label="Mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`mode-btn${view === m.id ? " active" : ""}`}
          aria-current={view === m.id ? "true" : undefined}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </nav>
  );
}
