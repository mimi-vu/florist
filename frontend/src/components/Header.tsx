import type { Vessel } from '../types';
import { VASES, WRAPS } from '../data/catalog';

interface Props {
  flowerCount: number;
  vessel: Vessel;
  editMode: boolean;
  onClear: () => void;
  onShowTutorial: () => void;
}

export function Header({ flowerCount, vessel, editMode, onClear, onShowTutorial }: Props) {
  const vesselLabel =
    vessel.kind === 'vase'
      ? VASES.find((v) => v.id === vessel.id)?.name
      : vessel.kind === 'wrap'
      ? WRAPS.find((w) => w.id === vessel.id)?.name
      : 'No vessel';

  return (
    <header className="header">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 64 64">
          <circle cx="32" cy="24" r="10" fill="#c0567a" />
          <circle cx="20" cy="28" r="8" fill="#e08aa4" />
          <circle cx="44" cy="28" r="8" fill="#e08aa4" />
          <circle cx="26" cy="18" r="7" fill="#f4b8c8" />
          <circle cx="38" cy="18" r="7" fill="#f4b8c8" />
          <circle cx="32" cy="24" r="5" fill="#fbe5ed" />
          <path d="M32 34 L32 58" stroke="#3a7a3a" strokeWidth="3" strokeLinecap="round" />
          <path d="M32 46 Q24 48 22 44" stroke="#3a7a3a" strokeWidth="2" fill="none" />
          <path d="M32 50 Q40 52 42 48" stroke="#3a7a3a" strokeWidth="2" fill="none" />
        </svg>
        <div>
          <span className="brand-name">Florist Studio</span>
          <span className="brand-tag">Design your flower arrangements</span>
        </div>
      </div>

      <div className="header-actions">
        <span className="tool-label">
          {flowerCount} stem{flowerCount === 1 ? '' : 's'} · {vesselLabel}
        </span>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onShowTutorial}
          title="Show tutorial"
          aria-label="Show tutorial"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.5 9.5a2.5 2.5 0 015 0c0 1.6-2.5 2-2.5 3.5"
            />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </svg>
          <span>Tutorial</span>
        </button>
        <button className="btn btn-ghost" onClick={onClear} disabled={!editMode}>
          Clear board
        </button>
      </div>
    </header>
  );
}
