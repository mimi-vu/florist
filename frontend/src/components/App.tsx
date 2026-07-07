import { useCallback, useEffect, useState } from 'react';
import type { FlowerId, PlacedFlower, Selection, Vessel, VaseId, WrapId } from '../types';
import { Header } from './Header';
import { FlowerPalette } from './FlowerPalette';
import { VesselPanel } from './VesselPanel';
import { DesignBoard3D } from '../three/DesignBoard3D';
import { TutorialOverlay } from './TutorialOverlay';

let uidCounter = 0;
const nextUid = () => `pf_${Date.now().toString(36)}_${uidCounter++}`;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SPIRAL_STEP = 0.62;      // radial step at each new stem
const CLUSTER_R = 3.4;         // stay inside this radius when auto-placing
const MIN_DIST = 0.55;         // no two auto-placements come closer than this

const TUTORIAL_KEY = 'florist-tutorial-seen';

/** Golden-angle spiral spot, biased near centre. Skips spots that already
 *  have a stem within MIN_DIST so multiple clicks never stack. */
function findClusterSpot(existing: PlacedFlower[]): [number, number, number] {
  for (let i = 0; i < 400; i++) {
    const r = Math.min(SPIRAL_STEP * Math.sqrt(i), CLUSTER_R);
    const a = i * GOLDEN_ANGLE;
    const x = r * Math.cos(a);
    const z = r * Math.sin(a);
    const clash = existing.some((p) => {
      const dx = p.position[0] - x;
      const dz = p.position[2] - z;
      return dx * dx + dz * dz < MIN_DIST * MIN_DIST;
    });
    if (!clash) return [x, 0, z];
  }
  return [0, 0, 0];
}

export default function App() {
  const [placed, setPlaced] = useState<PlacedFlower[]>([]);
  const [vessel, setVessel] = useState<Vessel>({ kind: 'none' });
  const [selection, setSelection] = useState<Selection>(null);
  const [boardColor, setBoardColor] = useState('#efe1c4');
  const [backgroundColor, setBackgroundColor] = useState('#f4ecda');
  const [draggingFlowerId, setDraggingFlowerId] = useState<FlowerId | null>(null);

  const [showTutorial, setShowTutorial] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(TUTORIAL_KEY) !== '1') setShowTutorial(true);
    } catch {
      setShowTutorial(true);
    }
  }, []);

  const dismissTutorial = useCallback(() => {
    try {
      localStorage.setItem(TUTORIAL_KEY, '1');
    } catch {
      /* ignore quota errors */
    }
    setShowTutorial(false);
  }, []);

  /* ---------- Flower actions ---------- */

  const handleAddFlower = useCallback(
    (flowerId: FlowerId, position: [number, number, number]) => {
      const pf: PlacedFlower = {
        uid: nextUid(),
        flowerId,
        position,
        rotationY: Math.random() * Math.PI * 2,
        tiltX: 0,
        tiltZ: 0,
        scale: 1,
        z: Date.now(),
      };
      setPlaced((prev) => [...prev, pf]);
      setSelection({ kind: 'flower', uid: pf.uid });
    },
    []
  );

  /** Click-to-place: drop the flower near the centre in a golden-angle
   *  spiral so repeated clicks don't stack. */
  const handleQuickAddFlower = useCallback((flowerId: FlowerId) => {
    setPlaced((prev) => {
      const position = findClusterSpot(prev);
      const pf: PlacedFlower = {
        uid: nextUid(),
        flowerId,
        position,
        rotationY: Math.random() * Math.PI * 2,
        tiltX: 0,
        tiltZ: 0,
        scale: 1,
        z: Date.now(),
      };
      setSelection({ kind: 'flower', uid: pf.uid });
      return [...prev, pf];
    });
  }, []);

  const handleSetFlowerPosition = useCallback(
    (uid: string, position: [number, number, number]) => {
      setPlaced((prev) => prev.map((p) => (p.uid === uid ? { ...p, position } : p)));
    },
    []
  );

  const handleSetFlowerRotationY = useCallback((uid: string, rotationY: number) => {
    setPlaced((prev) => prev.map((p) => (p.uid === uid ? { ...p, rotationY } : p)));
  }, []);

  const handleSetFlowerTilt = useCallback(
    (uid: string, tiltX: number, tiltZ: number) => {
      setPlaced((prev) =>
        prev.map((p) => (p.uid === uid ? { ...p, tiltX, tiltZ } : p))
      );
    },
    []
  );

  const handleSetFlowerScale = useCallback((uid: string, scale: number) => {
    setPlaced((prev) =>
      prev.map((p) =>
        p.uid === uid ? { ...p, scale: Math.max(0.35, Math.min(2.8, scale)) } : p
      )
    );
  }, []);

  const handleBringForward = useCallback((uid: string) => {
    setPlaced((prev) => prev.map((p) => (p.uid === uid ? { ...p, z: Date.now() } : p)));
  }, []);

  const handleRemoveFlower = useCallback((uid: string) => {
    setPlaced((prev) => prev.filter((p) => p.uid !== uid));
    setSelection(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setPlaced([]);
    setSelection(null);
  }, []);

  /* ---------- Vessel actions (side-panel only) ---------- */

  const handleSetVessel = useCallback(
    (next: { kind: 'vase'; id: VaseId } | { kind: 'wrap'; id: WrapId } | { kind: 'none' }) => {
      if (next.kind === 'none') {
        setVessel({ kind: 'none' });
      } else if (next.kind === 'vase') {
        setVessel({ kind: 'vase', id: next.id, scale: 1 });
      } else {
        setVessel({ kind: 'wrap', id: next.id, scale: 1 });
      }
    },
    []
  );

  const handleSetVesselScale = useCallback((scale: number) => {
    setVessel((v) =>
      v.kind === 'none' ? v : { ...v, scale: Math.max(0.5, Math.min(2, scale)) }
    );
  }, []);

  const handleRemoveVessel = useCallback(() => {
    setVessel({ kind: 'none' });
  }, []);

  return (
    <div className="app">
      <Header
        flowerCount={placed.length}
        vessel={vessel}
        onClear={handleClearAll}
        onShowTutorial={() => setShowTutorial(true)}
      />
      <FlowerPalette
        onQuickAdd={handleQuickAddFlower}
        onDragStartFlower={setDraggingFlowerId}
        onDragEndFlower={() => setDraggingFlowerId(null)}
      />
      <DesignBoard3D
        placed={placed}
        vessel={vessel}
        selection={selection}
        boardColor={boardColor}
        backgroundColor={backgroundColor}
        draggingFlowerId={draggingFlowerId}
        onBoardColorChange={setBoardColor}
        onBackgroundColorChange={setBackgroundColor}
        onSelect={setSelection}
        onAdd={handleAddFlower}
        onSetPosition={handleSetFlowerPosition}
        onSetRotationY={handleSetFlowerRotationY}
        onSetTilt={handleSetFlowerTilt}
        onSetScale={handleSetFlowerScale}
        onBringForward={handleBringForward}
        onRemove={handleRemoveFlower}
      />
      <VesselPanel
        vessel={vessel}
        onChange={handleSetVessel}
        onSetScale={handleSetVesselScale}
        onRemove={handleRemoveVessel}
      />
      <TutorialOverlay open={showTutorial} onClose={dismissTutorial} />
    </div>
  );
}
