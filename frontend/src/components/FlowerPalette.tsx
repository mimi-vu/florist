import { useState } from 'react';
import { FLOWERS } from '../data/catalog';
import type { FlowerId } from '../types';

interface Props {
  editMode: boolean;
  onQuickAdd: (id: FlowerId) => void;
  onDragStartFlower: (id: FlowerId) => void;
  onDragEndFlower: () => void;
}

export function FlowerPalette({ editMode, onQuickAdd, onDragStartFlower, onDragEndFlower }: Props) {
  const [query, setQuery] = useState('');

  const filtered = FLOWERS.filter((f) => {
    const q = query.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.latin.toLowerCase().includes(q);
  });
  const flora = filtered.filter((f) => f.category !== 'fauna');
  const fauna = filtered.filter((f) => f.category === 'fauna');

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: FlowerId) => {
    if (!editMode) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/x-florist-flower', id);
    e.dataTransfer.effectAllowed = 'copy';
    onDragStartFlower(id);
  };

  return (
    <aside className={`palette ${editMode ? '' : 'palette-readonly'}`}>
      <div className="palette-header">
        <h2 className="palette-title">Flora</h2>
      </div>
      {!editMode && (
        <p className="palette-readonly-hint">
          View mode — switch to Edit to add or drag stems.
        </p>
      )}
      <div className="palette-controls">
        <input
          className="palette-search"
          placeholder="Search rose, peony…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="palette-list">
        {flora.map((f) => (
          <PaletteCard
            key={f.id}
            id={f.id}
            name={f.name}
            latin={f.latin}
            tint={f.tint}
            editMode={editMode}
            onQuickAdd={onQuickAdd}
            onDragStart={handleDragStart}
            onDragEnd={onDragEndFlower}
          />
        ))}
        {fauna.length > 0 && (
          <>
            <h3 className="palette-sub palette-sub-section">Fauna</h3>
            {fauna.map((f) => (
              <PaletteCard
                key={f.id}
                id={f.id}
                name={f.name}
                latin={f.latin}
                tint={f.tint}
                editMode={editMode}
                onQuickAdd={onQuickAdd}
                onDragStart={handleDragStart}
                onDragEnd={onDragEndFlower}
              />
            ))}
          </>
        )}
        {filtered.length === 0 && <div className="palette-empty">No stems match.</div>}
      </div>
    </aside>
  );
}

function PaletteCard({
  id,
  name,
  latin,
  tint,
  editMode,
  onQuickAdd,
  onDragStart,
  onDragEnd,
}: {
  id: FlowerId;
  name: string;
  latin: string;
  tint: string;
  editMode: boolean;
  onQuickAdd: (id: FlowerId) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: FlowerId) => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      className="flower-card"
      draggable={editMode}
      onDragStart={(e) => onDragStart(e, id)}
      onDragEnd={editMode ? onDragEnd : undefined}
      onClick={editMode ? () => onQuickAdd(id) : undefined}
      title={
        editMode
          ? `${name} — ${latin} · click to add, drag for a specific spot`
          : `${name} — ${latin} · view mode (editing disabled)`
      }
    >
      <FlowerIcon tint={tint} />
      <div className="flower-card-body">
        <div className="flower-card-name">{name}</div>
        <div className="flower-card-latin">{latin}</div>
      </div>
    </div>
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
