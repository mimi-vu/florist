import { useCallback, useRef, useState } from 'react';
import type { PlacedFlower, Selection, Vessel } from '../types';

export interface BoardSnapshot {
  placed: PlacedFlower[];
  vessel: Vessel;
  selection: Selection;
}

const MAX_HISTORY = 50;

function cloneSnapshot(s: BoardSnapshot): BoardSnapshot {
  return {
    placed: s.placed.map((p) => ({
      ...p,
      position: [...p.position] as [number, number, number],
    })),
    vessel:
      s.vessel.kind === 'none'
        ? { kind: 'none' as const }
        : s.vessel.kind === 'vase'
        ? { kind: 'vase' as const, id: s.vessel.id, scale: s.vessel.scale }
        : { kind: 'wrap' as const, id: s.vessel.id, scale: s.vessel.scale },
    selection: s.selection ? { ...s.selection } : null,
  };
}

export function useBoardHistory(initial: BoardSnapshot) {
  const pastRef = useRef<BoardSnapshot[]>([]);
  const futureRef = useRef<BoardSnapshot[]>([]);
  const presentRef = useRef(initial);
  const editSessionRef = useRef(false);

  const [present, setPresent] = useState(initial);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const applyPresent = useCallback(
    (next: BoardSnapshot) => {
      presentRef.current = next;
      setPresent(next);
    },
    []
  );

  const pushPast = useCallback((snapshot: BoardSnapshot) => {
    pastRef.current.push(cloneSnapshot(snapshot));
    if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift();
    futureRef.current = [];
    syncFlags();
  }, [syncFlags]);

  /** Call before a drag/resize gesture so intermediate moves share one undo step. */
  const beginEditSession = useCallback(() => {
    if (editSessionRef.current) return;
    editSessionRef.current = true;
    pushPast(presentRef.current);
  }, [pushPast]);

  const endEditSession = useCallback(() => {
    editSessionRef.current = false;
  }, []);

  const mutate = useCallback(
    (produce: (prev: BoardSnapshot) => BoardSnapshot) => {
      setPresent((prev) => {
        if (!editSessionRef.current) pushPast(prev);
        const next = produce(prev);
        presentRef.current = next;
        editSessionRef.current = false;
        return next;
      });
    },
    [pushPast]
  );

  const patch = useCallback(
    (produce: (prev: BoardSnapshot) => BoardSnapshot) => {
      setPresent((prev) => {
        const next = produce(prev);
        presentRef.current = next;
        return next;
      });
    },
    []
  );

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return;
    editSessionRef.current = false;
    const previous = pastRef.current.pop()!;
    futureRef.current.unshift(cloneSnapshot(presentRef.current));
    applyPresent(previous);
    syncFlags();
  }, [applyPresent, syncFlags]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    editSessionRef.current = false;
    const next = futureRef.current.shift()!;
    pastRef.current.push(cloneSnapshot(presentRef.current));
    applyPresent(next);
    syncFlags();
  }, [applyPresent, syncFlags]);

  return {
    present,
    canUndo,
    canRedo,
    mutate,
    patch,
    beginEditSession,
    endEditSession,
    undo,
    redo,
  };
}
