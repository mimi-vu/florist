import { useState } from 'react';
import { FLOWERS } from '../data/catalog';
import type { FlowerId } from '../types';

interface Props {
  onQuickAdd: (id: FlowerId) => void;
  onDragStartFlower: (id: FlowerId) => void;
  onDragEndFlower: () => void;
}

export function FlowerPalette({ onQuickAdd, onDragStartFlower, onDragEndFlower }: Props) {
  const [query, setQuery] = useState('');

  const filtered = FLOWERS.filter((f) => {
    const q = query.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.latin.toLowerCase().includes(q);
  });

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: FlowerId) => {
    e.dataTransfer.setData('application/x-florist-flower', id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStartFlower(id);
  };

  return (
    <aside className="palette">
      <div className="palette-header">
        <h2 className="palette-title">Flowers</h2>
        <div className="palette-sub">Drag onto the board · click to drop near centre</div>
      </div>
      <div className="palette-controls">
        <input
          className="palette-search"
          placeholder="Search rose, peony…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="palette-list">
        {filtered.map((f) => (
          <div
            key={f.id}
            className="flower-card"
            draggable
            onDragStart={(e) => handleDragStart(e, f.id)}
            onDragEnd={onDragEndFlower}
            onClick={() => onQuickAdd(f.id)}
            title={`${f.name} — ${f.latin} · click to add, drag for a specific spot`}
          >
            <FlowerIcon tint={f.tint} />
            <div className="flower-card-body">
              <div className="flower-card-name">{f.name}</div>
              <div className="flower-card-latin">{f.latin}</div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="palette-empty">No flowers match.</div>}
      </div>
    </aside>
  );
}

function FlowerIcon({ tint }: { tint: string }) {
  return (
    <svg className="flower-icon" viewBox="0 0 40 60" width={40} height={60}>
      <defs>
        <radialGradient id={`fi-${tint}`} cx="0.5" cy="0.35" r="0.6">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="60%" stopColor={tint} />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <path d="M20 25 L20 58" stroke="#3f7f3a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M20 40 Q12 38 10 32" stroke="#3f7f3a" strokeWidth="1.2" fill="none" />
      <path d="M20 46 Q28 44 30 38" stroke="#3f7f3a" strokeWidth="1.2" fill="none" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="14"
          rx="6"
          ry="9"
          fill={`url(#fi-${tint})`}
          transform={`rotate(${deg} 20 20)`}
          opacity="0.9"
        />
      ))}
      <circle cx="20" cy="20" r="3.5" fill={tint} />
      <circle cx="20" cy="20" r="1.6" fill="#3f2a10" opacity="0.7" />
    </svg>
  );
}
