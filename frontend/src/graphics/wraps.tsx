import type { WrapId } from '../types';

/*
 * Wraps sit behind the bouquet like a paper cone. All wraps share the same
 * 600 × 500 viewBox — a broad triangle that fans outward at the top.
 */

interface WrapArtProps {
  uid: string;
}

interface Palette {
  base: string;
  fold: string;
  edge: string;
  accent?: string;
}

function PaperCone({ uid, palette }: { uid: string; palette: Palette }) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('cone')} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor={palette.base} />
          <stop offset="70%" stopColor={palette.fold} />
          <stop offset="100%" stopColor={palette.edge} />
        </linearGradient>
      </defs>
      {/* Back layer — wider */}
      <path
        d="M40 40 L560 40 L440 460 L160 460 Z"
        fill={`url(#${g('cone')})`}
        stroke={palette.edge}
        strokeWidth="2"
        opacity="0.95"
      />
      {/* Front layer — inner overlap */}
      <path
        d="M120 60 L480 60 L400 440 L200 440 Z"
        fill={palette.fold}
        stroke={palette.edge}
        strokeWidth="1.5"
        opacity="0.75"
      />
      {/* Fold creases */}
      {[220, 300, 380].map((x) => (
        <line key={x} x1={x} y1="60" x2={x - (x - 300) * 0.4} y2="440" stroke={palette.edge} strokeWidth="0.8" opacity="0.5" />
      ))}
      {/* Twine tie */}
      <path d="M240 430 Q300 445 360 430" stroke="#8b5a2b" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M290 435 Q300 460 285 480" stroke="#8b5a2b" strokeWidth="2.5" fill="none" />
      <path d="M310 435 Q305 460 320 480" stroke="#8b5a2b" strokeWidth="2.5" fill="none" />
    </g>
  );
}

function Kraft({ uid }: WrapArtProps) {
  return <PaperCone uid={uid} palette={{ base: '#c69662', fold: '#a67746', edge: '#7a5230' }} />;
}
function IvoryTissue({ uid }: WrapArtProps) {
  return <PaperCone uid={uid} palette={{ base: '#fbf7f0', fold: '#efe9d5', edge: '#b8b09a' }} />;
}
function MatteBlack({ uid }: WrapArtProps) {
  return <PaperCone uid={uid} palette={{ base: '#2a2a2a', fold: '#1a1a1a', edge: '#000000' }} />;
}
function BlushPink({ uid }: WrapArtProps) {
  return <PaperCone uid={uid} palette={{ base: '#f8cdd4', fold: '#e8a8b3', edge: '#a86470' }} />;
}
function SageLinen({ uid }: WrapArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <PaperCone uid={uid} palette={{ base: '#c8d3b8', fold: '#a5b490', edge: '#6b7a5a' }} />
      {/* Linen weave */}
      <defs>
        <pattern id={g('linen')} width="6" height="6" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="6" y2="0" stroke="#8ba078" strokeWidth="0.4" opacity="0.5" />
          <line x1="0" y1="3" x2="6" y2="3" stroke="#8ba078" strokeWidth="0.4" opacity="0.5" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="#8ba078" strokeWidth="0.4" opacity="0.5" />
          <line x1="3" y1="0" x2="3" y2="6" stroke="#8ba078" strokeWidth="0.4" opacity="0.5" />
        </pattern>
      </defs>
      <path d="M40 40 L560 40 L440 460 L160 460 Z" fill={`url(#${g('linen')})`} opacity="0.6" />
    </g>
  );
}
function FrenchLace({ uid }: WrapArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <PaperCone uid={uid} palette={{ base: '#fbf7f0', fold: '#f0ead9', edge: '#c9c0aa' }} />
      <defs>
        <pattern id={g('lace')} width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="6" fill="none" stroke="#b8b09a" strokeWidth="0.6" />
          <circle cx="15" cy="15" r="2" fill="none" stroke="#b8b09a" strokeWidth="0.6" />
          <circle cx="0" cy="0" r="3" fill="none" stroke="#b8b09a" strokeWidth="0.6" />
          <circle cx="30" cy="0" r="3" fill="none" stroke="#b8b09a" strokeWidth="0.6" />
          <circle cx="0" cy="30" r="3" fill="none" stroke="#b8b09a" strokeWidth="0.6" />
          <circle cx="30" cy="30" r="3" fill="none" stroke="#b8b09a" strokeWidth="0.6" />
        </pattern>
      </defs>
      <path d="M40 40 L560 40 L440 460 L160 460 Z" fill={`url(#${g('lace')})`} opacity="0.9" />
    </g>
  );
}
function Burlap({ uid }: WrapArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <PaperCone uid={uid} palette={{ base: '#c9a878', fold: '#a68856', edge: '#6b5535' }} />
      <defs>
        <pattern id={g('burlap')} width="5" height="5" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="5" y2="0" stroke="#6b5535" strokeWidth="0.6" />
          <line x1="0" y1="2.5" x2="5" y2="2.5" stroke="#8b6b40" strokeWidth="0.5" />
          <line x1="0" y1="0" x2="0" y2="5" stroke="#6b5535" strokeWidth="0.6" />
          <line x1="2.5" y1="0" x2="2.5" y2="5" stroke="#8b6b40" strokeWidth="0.5" />
        </pattern>
      </defs>
      <path d="M40 40 L560 40 L440 460 L160 460 Z" fill={`url(#${g('burlap')})`} opacity="0.6" />
    </g>
  );
}
function Cellophane({ uid }: WrapArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('cello')} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="60%" stopColor="#c9e2ec" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7aa3b8" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <path d="M40 40 L560 40 L440 460 L160 460 Z" fill={`url(#${g('cello')})`} stroke="#a5c0cc" strokeWidth="1.5" opacity="0.9" />
      {/* Shine streaks */}
      {[120, 200, 300, 400, 480].map((x) => (
        <line key={x} x1={x} y1="60" x2={x - (x - 300) * 0.35} y2="440" stroke="#ffffff" strokeWidth="2" opacity="0.5" />
      ))}
      <path d="M240 430 Q300 445 360 430" stroke="#c9a878" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}
function Newsprint({ uid }: WrapArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <PaperCone uid={uid} palette={{ base: '#efe9d5', fold: '#e0d6b8', edge: '#8a7a5a' }} />
      <defs>
        <pattern id={g('news')} width="60" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="4" x2="60" y2="4" stroke="#2a2a2a" strokeWidth="0.8" opacity="0.6" />
          <line x1="0" y1="7" x2="45" y2="7" stroke="#2a2a2a" strokeWidth="0.5" opacity="0.5" />
        </pattern>
      </defs>
      <path d="M120 90 L480 90 L400 440 L200 440 Z" fill={`url(#${g('news')})`} opacity="0.85" />
      <text x="300" y="130" textAnchor="middle" fontFamily="serif" fontSize="20" fontWeight="bold" fill="#1a1a1a" opacity="0.85">
        FLORIST TIMES
      </text>
    </g>
  );
}
function DeepNavy({ uid }: WrapArtProps) {
  return <PaperCone uid={uid} palette={{ base: '#1e2f4d', fold: '#152238', edge: '#0a1220' }} />;
}
function TerracottaCraft({ uid }: WrapArtProps) {
  return <PaperCone uid={uid} palette={{ base: '#c96e42', fold: '#a55130', edge: '#6b331c' }} />;
}
function GoldFoil({ uid }: WrapArtProps) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <g>
      <defs>
        <linearGradient id={g('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#8b6b1a" />
          <stop offset="35%" stopColor="#f5d24a" />
          <stop offset="55%" stopColor="#fff2a8" />
          <stop offset="75%" stopColor="#d4a538" />
          <stop offset="100%" stopColor="#5a4210" />
        </linearGradient>
      </defs>
      <path d="M40 40 L560 40 L440 460 L160 460 Z" fill={`url(#${g('gold')})`} stroke="#5a4210" strokeWidth="2" />
      <path d="M120 60 L480 60 L400 440 L200 440 Z" fill={`url(#${g('gold')})`} opacity="0.6" stroke="#5a4210" strokeWidth="1" />
      {/* Crinkle highlights */}
      {[180, 250, 320, 390, 450].map((x) => (
        <line key={x} x1={x} y1="60" x2={x - (x - 300) * 0.4} y2="440" stroke="#ffffff" strokeWidth="1.2" opacity="0.55" />
      ))}
      <path d="M240 430 Q300 445 360 430" stroke="#5a4210" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  );
}

const WRAP_RENDERERS: Record<WrapId, (p: WrapArtProps) => JSX.Element> = {
  'wrap-kraft': Kraft,
  'wrap-white': IvoryTissue,
  'wrap-black': MatteBlack,
  'wrap-blush': BlushPink,
  'wrap-sage': SageLinen,
  'wrap-lace': FrenchLace,
  'wrap-burlap': Burlap,
  'wrap-cellophane': Cellophane,
  'wrap-newsprint': Newsprint,
  'wrap-navy': DeepNavy,
  'wrap-terracotta': TerracottaCraft,
  'wrap-gold': GoldFoil,
};

export interface WrapSVGProps {
  id: WrapId;
  uid: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export function WrapSVG({ id, uid, width, height, style }: WrapSVGProps) {
  const Art = WRAP_RENDERERS[id];
  return (
    <svg viewBox="0 0 600 500" width={width} height={height} style={style} xmlns="http://www.w3.org/2000/svg">
      <Art uid={uid} />
    </svg>
  );
}
