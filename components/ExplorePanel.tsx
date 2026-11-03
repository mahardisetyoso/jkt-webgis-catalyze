type Layer = { id: string; label: string; visible: boolean };

export default function ExplorePanel({
  layers,
  onToggle,
}: {
  layers: Layer[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="explore-panel">
      <h3>Jelajahi peta</h3>
      {layers.map((layer) => (
        <label key={layer.id} className="explore-toggle">
          <input
            type="checkbox"
            checked={layer.visible}
            onChange={() => onToggle(layer.id)}
          />
          <span>{layer.label}</span>
        </label>
      ))}
    </div>
  );
}
