import type { ViewMode } from "../ModeNav";

const MODES: { id: ViewMode; label: string }[] = [
  { id: "story", label: "Cerita" },
  { id: "gallery", label: "Galeri" },
  { id: "explore", label: "Jelajah" },
];

export default function NavV2({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}) {
  return (
    <div className="v2-nav">
      <span className="v2-mark"><span className="v2-dot" />Jakarta</span>
      <nav aria-label="Mode">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={`v2-nav-btn${view === m.id ? " active" : ""}`}
            aria-current={view === m.id ? "true" : undefined}
            onClick={() => onChange(m.id)}
          >
            {m.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
