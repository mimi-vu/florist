import type { VaseId } from '../types';

/*
 * Vases sit on the bottom of the design board. All vases share the same
 * 400 × 320 viewBox with the opening centered at x=200, y=40 so flowers
 * can slot in visually.
 */

interface VaseArtProps {
  uid: string;
}

function GlassCylinder({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#c9e2ec" stopOpacity="0.6" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8fb3c5" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="120" ry="18" fill="#000" opacity="0.2" />
      <path d="M110 40 L110 260 Q200 300 290 260 L290 40 Q200 55 110 40 Z" fill={`url(#${g('body')})`} stroke="#87a4b3" strokeWidth="1.4" />
      <ellipse cx="200" cy="40" rx="90" ry="12" fill="none" stroke="#87a4b3" strokeWidth="1.4" />
      <ellipse cx="200" cy="40" rx="90" ry="12" fill="#ffffff" opacity="0.35" />
      {/* Water line */}
      <path d="M120 100 Q200 118 280 100" stroke="#7ab3d6" strokeWidth="1" fill="none" opacity="0.7" />
      {/* Highlight */}
      <path d="M135 60 L140 240" stroke="#ffffff" strokeWidth="4" opacity="0.55" />
    </g>
  );
}

function Crystal({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#e8f0f5" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#b6ccd8" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="130" ry="20" fill="#000" opacity="0.22" />
      <path d="M120 40 L100 260 Q200 300 300 260 L280 40 Q200 55 120 40 Z" fill={`url(#${g('body')})`} stroke="#8ba7b6" strokeWidth="1.4" />
      {/* Faceted vertical lines */}
      {[130, 160, 200, 240, 270].map((x) => (
        <line key={x} x1={x} y1="45" x2={x + (x - 200) * 0.05} y2="270" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
      ))}
      {/* Diamond cuts */}
      {Array.from({ length: 4 }).map((_, r) =>
        Array.from({ length: 5 }).map((_, c) => (
          <path
            key={`${r}-${c}`}
            d={`M${130 + c * 35} ${90 + r * 45} l 8 8 l -8 8 l -8 -8 Z`}
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.8"
            opacity="0.6"
          />
        ))
      )}
      <ellipse cx="200" cy="40" rx="80" ry="10" fill="none" stroke="#8ba7b6" strokeWidth="1.4" />
    </g>
  );
}

function CeramicWhite({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#e0d9c9" />
          <stop offset="45%" stopColor="#fbf7f0" />
          <stop offset="100%" stopColor="#c9c0aa" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="140" ry="20" fill="#000" opacity="0.22" />
      <path
        d="M130 40 Q90 100 100 180 Q100 260 200 300 Q300 260 300 180 Q310 100 270 40 Q200 55 130 40 Z"
        fill={`url(#${g('body')})`}
        stroke="#a89b7a"
        strokeWidth="1.4"
      />
      <ellipse cx="200" cy="40" rx="70" ry="10" fill="#f0e9d3" stroke="#a89b7a" strokeWidth="1.4" />
      <path d="M140 80 Q135 140 145 200" stroke="#ffffff" strokeWidth="6" opacity="0.5" fill="none" />
    </g>
  );
}

function Terracotta({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#8b4a2b" />
          <stop offset="50%" stopColor="#c96e42" />
          <stop offset="100%" stopColor="#7a3d21" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="140" ry="20" fill="#000" opacity="0.25" />
      <path d="M110 40 L130 270 Q200 300 270 270 L290 40 Q200 55 110 40 Z" fill={`url(#${g('body')})`} stroke="#5a2a15" strokeWidth="1.4" />
      <rect x="105" y="40" width="190" height="24" rx="4" fill={`url(#${g('body')})`} stroke="#5a2a15" strokeWidth="1.4" />
      <ellipse cx="200" cy="40" rx="95" ry="12" fill="#5a2a15" opacity="0.4" />
      {/* Texture speckles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <circle
          key={i}
          cx={130 + Math.random() * 140}
          cy={80 + Math.random() * 180}
          r={Math.random() * 1.5 + 0.3}
          fill="#3a1f10"
          opacity="0.4"
        />
      ))}
    </g>
  );
}

function Brass({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#7a5b1a" />
          <stop offset="35%" stopColor="#e8c76a" />
          <stop offset="55%" stopColor="#fff1b8" />
          <stop offset="75%" stopColor="#d4a538" />
          <stop offset="100%" stopColor="#5a4210" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="120" ry="18" fill="#000" opacity="0.28" />
      <path d="M130 40 Q100 100 110 200 Q120 280 200 300 Q280 280 290 200 Q300 100 270 40 Q200 55 130 40 Z" fill={`url(#${g('body')})`} stroke="#5a4210" strokeWidth="1.2" />
      <ellipse cx="200" cy="40" rx="70" ry="10" fill="#8a6b20" stroke="#5a4210" strokeWidth="1.2" />
      {/* Ring bands */}
      {[80, 150, 220].map((y) => (
        <ellipse key={y} cx="200" cy={y} rx="88" ry="6" fill="none" stroke="#5a4210" strokeWidth="1" opacity="0.5" />
      ))}
    </g>
  );
}

function BlackMatte({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#1a1a1a" />
          <stop offset="50%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="135" ry="20" fill="#000" opacity="0.35" />
      <path d="M120 40 L115 260 Q200 300 285 260 L280 40 Q200 55 120 40 Z" fill={`url(#${g('body')})`} stroke="#000" strokeWidth="1.4" />
      <ellipse cx="200" cy="40" rx="80" ry="10" fill="#0a0a0a" stroke="#000" strokeWidth="1.4" />
      <path d="M135 70 Q130 160 140 250" stroke="#5a5a5a" strokeWidth="4" opacity="0.5" fill="none" />
    </g>
  );
}

function MasonJar({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#b7dbd0" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#e8f4ef" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8fb3a5" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="120" ry="18" fill="#000" opacity="0.2" />
      {/* Threaded neck */}
      <rect x="150" y="40" width="100" height="30" fill={`url(#${g('body')})`} stroke="#7a9d90" strokeWidth="1.2" />
      {[46, 54, 62].map((y) => (
        <line key={y} x1="152" y1={y} x2="248" y2={y} stroke="#7a9d90" strokeWidth="0.6" opacity="0.7" />
      ))}
      {/* Body */}
      <path d="M140 70 L130 260 Q200 300 270 260 L260 70 Q200 82 140 70 Z" fill={`url(#${g('body')})`} stroke="#7a9d90" strokeWidth="1.4" />
      <path d="M155 90 L150 240" stroke="#ffffff" strokeWidth="4" opacity="0.6" />
      <text x="200" y="175" textAnchor="middle" fontFamily="serif" fontSize="14" fill="#4a6b60" opacity="0.4" fontWeight="bold">
        MASON
      </text>
    </g>
  );
}

function BudTrio({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('amber')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#8b4a10" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#e89c40" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#6b3a08" stopOpacity="0.7" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="150" ry="18" fill="#000" opacity="0.22" />
      {[80, 200, 320].map((cx, i) => (
        <g key={cx}>
          <path
            d={`M${cx - 15} 60 Q${cx - 25} 150 ${cx - 12} 260 Q${cx} 285 ${cx + 12} 260 Q${cx + 25} 150 ${cx + 15} 60 Q${cx} 70 ${cx - 15} 60 Z`}
            fill={`url(#${g('amber')})`}
            stroke="#5a2a08"
            strokeWidth="1.2"
          />
          <ellipse cx={cx} cy="60" rx="14" ry="4" fill="#5a2a08" opacity="0.6" />
          <path d={`M${cx - 8} 80 Q${cx - 12} 180 ${cx - 6} 240`} stroke="#ffffff" strokeWidth="2" opacity="0.5" fill="none" />
        </g>
      ))}
    </g>
  );
}

function PorcelainBlue({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#dbe6f0" />
          <stop offset="45%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b8c9db" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="140" ry="20" fill="#000" opacity="0.22" />
      <path
        d="M140 40 Q100 90 110 170 Q100 250 200 300 Q300 250 290 170 Q300 90 260 40 Q200 55 140 40 Z"
        fill={`url(#${g('body')})`}
        stroke="#3a5a8b"
        strokeWidth="1.4"
      />
      <ellipse cx="200" cy="40" rx="70" ry="10" fill="#f0f4fa" stroke="#3a5a8b" strokeWidth="1.4" />
      {/* Painted blue floral motif */}
      <g fill="#2e4b7a" opacity="0.75">
        <circle cx="160" cy="140" r="6" />
        <circle cx="150" cy="150" r="4" />
        <circle cx="170" cy="150" r="4" />
        <circle cx="240" cy="180" r="6" />
        <circle cx="250" cy="190" r="4" />
        <circle cx="230" cy="190" r="4" />
        <path d="M180 210 Q200 220 220 210" stroke="#2e4b7a" strokeWidth="1.5" fill="none" />
        <path d="M170 100 Q200 90 230 100" stroke="#2e4b7a" strokeWidth="1.5" fill="none" />
      </g>
    </g>
  );
}

function FlutedMilk({ uid }: VaseArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('body')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#e0dbcc" />
          <stop offset="45%" stopColor="#fffaf0" />
          <stop offset="100%" stopColor="#c9c3ae" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="290" rx="130" ry="20" fill="#000" opacity="0.22" />
      <path d="M115 40 L120 260 Q200 300 280 260 L285 40 Q200 55 115 40 Z" fill={`url(#${g('body')})`} stroke="#a89b7a" strokeWidth="1.4" />
      {/* Vertical flutes */}
      {[130, 150, 170, 200, 230, 250, 270].map((x) => (
        <line key={x} x1={x} y1="50" x2={x + (x - 200) * 0.05} y2="270" stroke="#a89b7a" strokeWidth="0.9" opacity="0.55" />
      ))}
      <ellipse cx="200" cy="40" rx="82" ry="10" fill="#efe9d5" stroke="#a89b7a" strokeWidth="1.4" />
    </g>
  );
}

const VASE_RENDERERS: Record<VaseId, (p: VaseArtProps) => JSX.Element> = {
  'vase-glass-cyl': GlassCylinder,
  'vase-crystal': Crystal,
  'vase-ceramic-white': CeramicWhite,
  'vase-terracotta': Terracotta,
  'vase-brass': Brass,
  'vase-black-matte': BlackMatte,
  'vase-mason': MasonJar,
  'vase-bud-trio': BudTrio,
  'vase-porcelain-blue': PorcelainBlue,
  'vase-fluted': FlutedMilk,
};

export interface VaseSVGProps {
  id: VaseId;
  uid: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export function VaseSVG({ id, uid, width, height, style }: VaseSVGProps) {
  const Art = VASE_RENDERERS[id];
  return (
    <svg viewBox="0 0 400 320" width={width} height={height} style={style} xmlns="http://www.w3.org/2000/svg">
      <Art uid={uid} />
    </svg>
  );
}
