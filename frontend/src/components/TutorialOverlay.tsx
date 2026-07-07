import { useEffect, useState } from 'react';

interface Step {
  title: string;
  body: string;
  illustration: React.ReactNode;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Florist Studio',
    body:
      'Design bouquets in 3D before you cut a single stem. This quick tour will show you how everything fits together — it takes under a minute.',
    illustration: <BouquetIllo />,
  },
  {
    title: 'Add flowers',
    body:
      'Drag a flower from the left panel to drop it exactly where you want on the board, or click a card to drop it near the centre. Repeated clicks stagger the stems so they never land on top of each other.',
    illustration: <ClickIllo />,
  },
  {
    title: 'Arrange your stems',
    body:
      'Click a flower to select it. Drag its body to move (side-on view lifts it up or down), drag the corner handles to resize, and drag the gold sphere at the top to tilt it. Click a selected flower again to cycle through overlapping stems.',
    illustration: <ArrangeIllo />,
  },
  {
    title: 'Pick a vessel',
    body:
      'Add a vase or a wrap from the right panel — one, the other, or neither. Use the size slider that appears to scale it to fit your arrangement.',
    illustration: <VesselIllo />,
  },
  {
    title: 'Customise & save',
    body:
      'Recolour the board disc and background from the toolbar at the top. When you are happy, save the arrangement as a photo (PNG) or as a real 3D model file (GLB) from the buttons on the bottom-left of the stage.',
    illustration: <SaveIllo />,
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TutorialOverlay({ open, onClose }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight')
        setStep((s) => Math.min(STEPS.length - 1, s + 1));
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div className="tutorial-backdrop" role="dialog" aria-modal="true">
      <div className="tutorial-card">
        <button className="tutorial-skip" onClick={onClose} aria-label="Skip tutorial">
          Skip
        </button>

        <div className="tutorial-illustration">{current.illustration}</div>

        <div className="tutorial-body">
          <div className="tutorial-eyebrow">
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 className="tutorial-title">{current.title}</h2>
          <p className="tutorial-text">{current.body}</p>
        </div>

        <div className="tutorial-footer">
          <button
            className="tutorial-arrow"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={isFirst}
            aria-label="Previous step"
          >
            <ChevronLeft />
          </button>

          <div className="tutorial-dots" role="tablist">
            {STEPS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === step}
                aria-label={`Step ${i + 1}`}
                className={`tutorial-dot ${i === step ? 'active' : ''}`}
                onClick={() => setStep(i)}
              />
            ))}
          </div>

          {isLast ? (
            <button className="tutorial-cta" onClick={onClose}>
              Get started
            </button>
          ) : (
            <button
              className="tutorial-arrow"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              aria-label="Next step"
            >
              <ChevronRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Chevrons -------------------- */

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 6l-6 6 6 6"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6l6 6-6 6"
      />
    </svg>
  );
}

/* -------------------- Illustrations --------------------
   Small handmade SVGs so the tutorial isn't just walls of text. */

function BouquetIllo() {
  return (
    <svg viewBox="0 0 240 160" width="100%" height="100%" aria-hidden>
      <defs>
        <linearGradient id="bg-illo-bg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#fdf6e6" />
          <stop offset="100%" stopColor="#f5e6c9" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="240" height="160" fill="url(#bg-illo-bg)" />
      <ellipse cx="120" cy="140" rx="70" ry="8" fill="#e6d3ac" opacity="0.6" />
      <path
        d="M96 132 L112 90 M120 132 L120 74 M144 132 L128 90 M108 132 L100 100"
        stroke="#3f7f3a"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="112" cy="86" r="12" fill="#e08aa4" />
      <circle cx="120" cy="70" r="14" fill="#c0567a" />
      <circle cx="128" cy="86" r="12" fill="#f4b8c8" />
      <circle cx="100" cy="96" r="10" fill="#f5b301" />
      <circle cx="140" cy="94" r="10" fill="#a58bd0" />
      <path
        d="M84 132 Q120 152 156 132"
        stroke="#a5825a"
        strokeWidth="4"
        fill="#fbf3e1"
      />
    </svg>
  );
}

function ClickIllo() {
  return (
    <svg viewBox="0 0 240 160" width="100%" height="100%" aria-hidden>
      <rect x="0" y="0" width="240" height="160" fill="#fdf6e6" />
      <rect
        x="20"
        y="30"
        rx="10"
        width="70"
        height="100"
        fill="#ffffff"
        stroke="#e0d3b8"
      />
      <circle cx="55" cy="60" r="12" fill="#c0567a" />
      <path
        d="M55 74 L55 108"
        stroke="#3f7f3a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M100 80 Q140 60 175 90"
        stroke="#a5825a"
        strokeWidth="2.5"
        strokeDasharray="5 5"
        fill="none"
      />
      <polygon points="175,90 168,84 170,94" fill="#a5825a" />
      <ellipse cx="180" cy="118" rx="34" ry="5" fill="#e6d3ac" opacity="0.7" />
      <circle cx="180" cy="98" r="9" fill="#c0567a" />
      <path d="M180 106 L180 118" stroke="#3f7f3a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="196" cy="102" r="6" fill="#f5b301" />
      <circle cx="164" cy="104" r="6" fill="#a58bd0" />
    </svg>
  );
}

function ArrangeIllo() {
  return (
    <svg viewBox="0 0 240 160" width="100%" height="100%" aria-hidden>
      <rect x="0" y="0" width="240" height="160" fill="#fdf6e6" />
      <ellipse cx="120" cy="130" rx="60" ry="6" fill="#e6d3ac" opacity="0.65" />
      <path d="M120 128 L120 62" stroke="#3f7f3a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="120" cy="58" r="14" fill="#c0567a" />
      <rect
        x="88"
        y="30"
        width="64"
        height="76"
        fill="none"
        stroke="#f5b301"
        strokeDasharray="4 3"
        strokeWidth="2"
        rx="2"
      />
      {[
        [88, 30],
        [152, 30],
        [88, 106],
        [152, 106],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x - 4} y={y - 4} width="8" height="8" fill="#f5b301" />
      ))}
      <circle cx="120" cy="24" r="6" fill="#f5b301" />
      <path d="M120 32 L120 30" stroke="#f5b301" strokeWidth="2" />
    </svg>
  );
}

function VesselIllo() {
  return (
    <svg viewBox="0 0 240 160" width="100%" height="100%" aria-hidden>
      <rect x="0" y="0" width="240" height="160" fill="#fdf6e6" />
      <ellipse cx="72" cy="140" rx="30" ry="4" fill="#e6d3ac" opacity="0.65" />
      <path
        d="M52 78 Q60 76 60 90 L60 118 Q60 138 72 138 Q84 138 84 118 L84 90 Q84 76 92 78 Z"
        fill="#dbe6f0"
        stroke="#8ea8c0"
      />
      <path d="M60 76 Q72 66 84 76" stroke="#8ea8c0" fill="none" />
      <circle cx="72" cy="60" r="8" fill="#c0567a" />
      <path d="M72 68 L72 78" stroke="#3f7f3a" strokeWidth="2" strokeLinecap="round" />

      <ellipse cx="168" cy="140" rx="32" ry="4" fill="#e6d3ac" opacity="0.65" />
      <path
        d="M148 92 L188 92 L182 138 Q168 132 154 138 Z"
        fill="#f4c2c2"
        stroke="#c98f8f"
      />
      <circle cx="168" cy="80" r="9" fill="#a58bd0" />
      <path d="M168 89 L168 100" stroke="#3f7f3a" strokeWidth="2" strokeLinecap="round" />
      <text x="120" y="30" textAnchor="middle" fontSize="13" fill="#8a7a5a" fontFamily="serif">
        Vase · Wrap · Neither
      </text>
    </svg>
  );
}

function SaveIllo() {
  return (
    <svg viewBox="0 0 240 160" width="100%" height="100%" aria-hidden>
      <rect x="0" y="0" width="240" height="160" fill="#fdf6e6" />
      <rect x="20" y="30" width="200" height="100" rx="8" fill="#ffffff" stroke="#e0d3b8" />
      <ellipse cx="120" cy="98" rx="40" ry="6" fill="#e6d3ac" opacity="0.6" />
      <path d="M120 96 L120 60" stroke="#3f7f3a" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="120" cy="56" r="10" fill="#c0567a" />
      <circle cx="106" cy="62" r="6" fill="#e08aa4" />
      <circle cx="134" cy="62" r="6" fill="#f4b8c8" />

      <rect x="30" y="110" width="60" height="18" rx="9" fill="#7a5a3a" />
      <text x="60" y="123" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="sans-serif">
        Photo
      </text>
      <rect x="100" y="110" width="80" height="18" rx="9" fill="#ffffff" stroke="#d6c9b3" />
      <text x="140" y="123" textAnchor="middle" fontSize="10" fill="#6b5a3e" fontFamily="sans-serif">
        3D model
      </text>

      <circle cx="200" cy="45" r="7" fill="#efe1c4" stroke="#a5825a" />
      <circle cx="200" cy="63" r="7" fill="#f4ecda" stroke="#a5825a" />
    </svg>
  );
}
