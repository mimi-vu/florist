import { useMemo, useState } from 'react';
import type { Credit, Vessel, VaseId, WrapId } from '../types';
import { FLOWERS, VASES, WRAPS } from '../data/catalog';
import { VaseSVG } from '../graphics/vases';
import { WrapSVG } from '../graphics/wraps';

type VesselChoice =
  | { kind: 'vase'; id: VaseId }
  | { kind: 'wrap'; id: WrapId }
  | { kind: 'none' };

interface Props {
  vessel: Vessel;
  onChange: (v: VesselChoice) => void;
  onSetScale: (scale: number) => void;
  onRemove: () => void;
}

type Tab = 'vases' | 'wraps';

export function VesselPanel({ vessel, onChange, onSetScale, onRemove }: Props) {
  const [tab, setTab] = useState<Tab>(vessel.kind === 'wrap' ? 'wraps' : 'vases');

  const activeName =
    vessel.kind === 'vase'
      ? VASES.find((v) => v.id === vessel.id)?.name
      : vessel.kind === 'wrap'
      ? WRAPS.find((w) => w.id === vessel.id)?.name
      : null;

  return (
    <aside className="vessels">
      <div className="vessels-header">
        <h2 className="vessels-title">Vessel</h2>
      </div>

      {vessel.kind !== 'none' && (
        <div className="vessel-active">
          <div className="vessel-active-name">{activeName}</div>
          <div className="vessel-active-row">
            <span className="vessel-active-label">Size</span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.02}
              value={vessel.scale}
              onChange={(e) => onSetScale(Number(e.target.value))}
              className="vessel-slider"
            />
            <span className="vessel-active-value">{vessel.scale.toFixed(2)}×</span>
          </div>
          <button className="vessel-clear" onClick={onRemove}>
            Remove vessel · loose stems
          </button>
        </div>
      )}

      <div className="vessel-tabs">
        <button
          className={`vessel-tab ${tab === 'vases' ? 'active' : ''}`}
          onClick={() => setTab('vases')}
        >
          Vases
        </button>
        <button
          className={`vessel-tab ${tab === 'wraps' ? 'active' : ''}`}
          onClick={() => setTab('wraps')}
        >
          Wraps
        </button>
      </div>

      <div className="vessel-list">
        {tab === 'vases' &&
          VASES.map((v) => {
            const selected = vessel.kind === 'vase' && vessel.id === v.id;
            return (
              <button
                key={v.id}
                className={`vessel-card ${selected ? 'selected' : ''}`}
                onClick={() =>
                  onChange(selected ? { kind: 'none' } : { kind: 'vase', id: v.id })
                }
              >
                <div className="vessel-card-svg">
                  <VaseSVG id={v.id} uid={`sel-${v.id}`} height={100} />
                </div>
                <div className="vessel-card-name">{v.name}</div>
                <div className="vessel-card-material">{v.material}</div>
              </button>
            );
          })}
        {tab === 'wraps' &&
          WRAPS.map((w) => {
            const selected = vessel.kind === 'wrap' && vessel.id === w.id;
            return (
              <button
                key={w.id}
                className={`vessel-card ${selected ? 'selected' : ''}`}
                onClick={() =>
                  onChange(selected ? { kind: 'none' } : { kind: 'wrap', id: w.id })
                }
              >
                <div className="vessel-card-svg">
                  <WrapSVG id={w.id} uid={`sel-${w.id}`} height={100} />
                </div>
                <div className="vessel-card-name">{w.name}</div>
                <div className="vessel-card-material">{w.material}</div>
              </button>
            );
          })}
      </div>

      <ModelCredits />
    </aside>
  );
}

function ModelCredits() {
  const groups = useMemo(() => {
    const map = new Map<string, Credit>();
    for (const f of FLOWERS) {
      if (!f.credit) continue;
      const key = `${f.credit.license}\u00A0${f.credit.author}`;
      if (!map.has(key)) map.set(key, f.credit);
    }
    return Array.from(map.values());
  }, []);
  if (groups.length === 0) return null;
  return (
    <div className="credits">
      <div style={{ marginBottom: 6, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        3D model credits
      </div>
      {groups.map((c) => (
        <div key={`${c.license}-${c.author}`}>
          <strong>{c.license}</strong> ·{' '}
          {c.authorUrl ? (
            <a href={c.authorUrl} target="_blank" rel="noreferrer" style={{ color: '#6b5a3e' }}>
              {c.author}
            </a>
          ) : (
            <span>{c.author}</span>
          )}
        </div>
      ))}
    </div>
  );
}
