import { useCallback, useEffect, useState } from 'react';
import type { FlowerId, PlacedFlower, Vessel, VaseId, WrapId, BoardMode } from '../types';
import { Header } from './Header';
import { FlowerPalette } from './FlowerPalette';
import { VesselPanel } from './VesselPanel';
import { DesignBoard3D } from '../three/DesignBoard3D';
import { TutorialOverlay } from './TutorialOverlay';
import { useBoardHistory } from '../hooks/useBoardHistory';

let uidCounter = 0;
const nextUid = () => `pf_${Date.now().toString(36)}_${uidCounter++}`;

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const SPIRAL_STEP = 0.62;
const CLUSTER_R = 3.4;
const MIN_DIST = 0.55;

const TUTORIAL_KEY = 'florist-tutorial-seen';

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

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export default function App() {
  const {
    present,
    canUndo,
    canRedo,
    mutate,
    patch,
    beginEditSession,
    endEditSession,
    undo,
    redo,
  } = useBoardHistory({
    placed: [],
    vessel: { kind: 'none' },
    selection: null,
  });

  const { placed, vessel, selection } = present;

  const [boardColor, setBoardColor] = useState('#efe1c4');
  const [backgroundColor, setBackgroundColor] = useState('#f4ecda');
  const [draggingFlowerId, setDraggingFlowerId] = useState<FlowerId | null>(null);
  const [boardMode, setBoardMode] = useState<BoardMode>('edit');

  const handleBoardModeChange = useCallback(
    (mode: BoardMode) => {
      setBoardMode(mode);
      if (mode === 'view') {
        patch((s) => ({ ...s, selection: null }));
        setDraggingFlowerId(null);
      }
    },
    [patch]
  );

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

  const handleSelect = useCallback(
    (sel: typeof selection) => {
      patch((s) => ({ ...s, selection: sel }));
    },
    [patch]
  );

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
      mutate((s) => ({
        ...s,
        placed: [...s.placed, pf],
        selection: { kind: 'flower', uid: pf.uid },
      }));
    },
    [mutate]
  );

  const handleQuickAddFlower = useCallback(
    (flowerId: FlowerId) => {
      mutate((s) => {
        const position = findClusterSpot(s.placed);
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
        return {
          ...s,
          placed: [...s.placed, pf],
          selection: { kind: 'flower', uid: pf.uid },
        };
      });
    },
    [mutate]
  );

  const handleSetFlowerPosition = useCallback(
    (uid: string, position: [number, number, number]) => {
      patch((s) => ({
        ...s,
        placed: s.placed.map((p) => (p.uid === uid ? { ...p, position } : p)),
      }));
    },
    [patch]
  );

  const handleSetFlowerRotationY = useCallback(
    (uid: string, rotationY: number) => {
      patch((s) => ({
        ...s,
        placed: s.placed.map((p) => (p.uid === uid ? { ...p, rotationY } : p)),
      }));
    },
    [patch]
  );

  const handleSetFlowerTilt = useCallback(
    (uid: string, tiltX: number, tiltZ: number) => {
      patch((s) => ({
        ...s,
        placed: s.placed.map((p) => (p.uid === uid ? { ...p, tiltX, tiltZ } : p)),
      }));
    },
    [patch]
  );

  const handleSetFlowerScale = useCallback(
    (uid: string, scale: number) => {
      patch((s) => ({
        ...s,
        placed: s.placed.map((p) =>
          p.uid === uid ? { ...p, scale: Math.max(0.35, Math.min(2.8, scale)) } : p
        ),
      }));
    },
    [patch]
  );

  const handleBringForward = useCallback(
    (uid: string) => {
      patch((s) => ({
        ...s,
        placed: s.placed.map((p) => (p.uid === uid ? { ...p, z: Date.now() } : p)),
      }));
    },
    [patch]
  );

  const handleRemoveFlower = useCallback(
    (uid: string) => {
      mutate((s) => ({
        ...s,
        placed: s.placed.filter((p) => p.uid !== uid),
        selection: null,
      }));
    },
    [mutate]
  );

  const handleClearAll = useCallback(() => {
    mutate((s) => ({ ...s, placed: [], selection: null }));
  }, [mutate]);

  const handleSetVessel = useCallback(
    (next: { kind: 'vase'; id: VaseId } | { kind: 'wrap'; id: WrapId } | { kind: 'none' }) => {
      mutate((s) => {
        let vessel: Vessel = { kind: 'none' };
        if (next.kind === 'vase') vessel = { kind: 'vase', id: next.id, scale: 1 };
        else if (next.kind === 'wrap') vessel = { kind: 'wrap', id: next.id, scale: 1 };
        return { ...s, vessel };
      });
    },
    [mutate]
  );

  const handleSetVesselScale = useCallback(
    (scale: number) => {
      patch((s) => {
        if (s.vessel.kind === 'none') return s;
        return {
          ...s,
          vessel: {
            ...s.vessel,
            scale: Math.max(0.5, Math.min(2, scale)),
          },
        };
      });
    },
    [patch]
  );

  const handleRemoveVessel = useCallback(() => {
    mutate((s) => ({ ...s, vessel: { kind: 'none' } }));
  }, [mutate]);

  const handleUndo = useCallback(() => {
    if (boardMode !== 'edit') return;
    undo();
  }, [boardMode, undo]);

  const handleRedo = useCallback(() => {
    if (boardMode !== 'edit') return;
    redo();
  }, [boardMode, redo]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (boardMode !== 'edit' || isTypingTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selection?.kind === 'flower') {
          e.preventDefault();
          handleRemoveFlower(selection.uid);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [boardMode, selection, undo, redo, handleRemoveFlower]);

  return (
    <div className="app">
      <Header
        flowerCount={placed.length}
        vessel={vessel}
        editMode={boardMode === 'edit'}
        onClear={handleClearAll}
        onShowTutorial={() => setShowTutorial(true)}
      />
      <FlowerPalette
        editMode={boardMode === 'edit'}
        onQuickAdd={handleQuickAddFlower}
        onDragStartFlower={setDraggingFlowerId}
        onDragEndFlower={() => setDraggingFlowerId(null)}
      />
      <DesignBoard3D
        placed={placed}
        vessel={vessel}
        selection={selection}
        boardMode={boardMode}
        onBoardModeChange={handleBoardModeChange}
        boardColor={boardColor}
        backgroundColor={backgroundColor}
        draggingFlowerId={draggingFlowerId}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onBoardColorChange={setBoardColor}
        onBackgroundColorChange={setBackgroundColor}
        onSelect={handleSelect}
        onAdd={handleAddFlower}
        onSetPosition={handleSetFlowerPosition}
        onSetRotationY={handleSetFlowerRotationY}
        onSetTilt={handleSetFlowerTilt}
        onSetScale={handleSetFlowerScale}
        onBringForward={handleBringForward}
        onRemove={handleRemoveFlower}
        onBeginEdit={beginEditSession}
        onEndEdit={endEditSession}
      />
      <VesselPanel
        editMode={boardMode === 'edit'}
        vessel={vessel}
        onChange={handleSetVessel}
        onSetScale={handleSetVesselScale}
        onRemove={handleRemoveVessel}
        onBeginEdit={beginEditSession}
        onEndEdit={endEditSession}
      />
      <TutorialOverlay open={showTutorial} onClose={dismissTutorial} />
    </div>
  );
}
