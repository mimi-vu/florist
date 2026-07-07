import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei';
import { GLTFExporter, type OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { FlowerId, PlacedFlower as PlacedFlowerT, Selection, Vessel } from '../types';
import { Flower3D } from './Flower3D';
import { Vase3D } from './Vase3D';
import { Wrap3D } from './Wrap3D';
import { FLOWERS } from '../data/catalog';

const MAX_RADIUS = 5.5;   // circular boundary for X/Z on the board
const MAX_HEIGHT = 4.5;   // upper limit for flower elevation
const BOX_W = 1.4;
const BOX_H = 3.3;        // wireframe height & where the tilt handle sits
const BOX_D = 1.4;

interface Props {
  placed: PlacedFlowerT[];
  vessel: Vessel;
  selection: Selection;
  boardColor: string;
  backgroundColor: string;
  draggingFlowerId: FlowerId | null;
  onBoardColorChange: (c: string) => void;
  onBackgroundColorChange: (c: string) => void;
  onSelect: (s: Selection) => void;
  onAdd: (id: FlowerId, pos: [number, number, number]) => void;
  onSetPosition: (uid: string, pos: [number, number, number]) => void;
  onSetRotationY: (uid: string, rotationY: number) => void;
  onSetTilt: (uid: string, tiltX: number, tiltZ: number) => void;
  onSetScale: (uid: string, scale: number) => void;
  onBringForward: (uid: string) => void;
  onRemove: (uid: string) => void;
}

export function DesignBoard3D(props: Props) {
  const {
    placed,
    vessel,
    selection,
    boardColor,
    backgroundColor,
    draggingFlowerId,
    onBoardColorChange,
    onBackgroundColorChange,
    onSelect,
    onAdd,
    onSetPosition,
    onSetRotationY,
    onSetTilt,
    onSetScale,
    onBringForward,
    onRemove,
  } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const canvasState = useRef<{
    camera: THREE.Camera;
    gl: THREE.WebGLRenderer;
    scene: THREE.Scene;
  } | null>(null);
  const bouquetRef = useRef<THREE.Group>(null);

  // Ghost silhouette shown while a flower is being dragged from the palette.
  const [ghost, setGhost] = useState<{ position: [number, number, number] } | null>(null);

  const resetView = () => controlsRef.current?.reset();

  const projectToBoard = (clientX: number, clientY: number): [number, number, number] | null => {
    if (!wrapRef.current || !canvasState.current) return null;
    const rect = wrapRef.current.getBoundingClientRect();
    const hit = raycastToPlane(
      canvasState.current.camera,
      clientX - rect.left,
      clientY - rect.top,
      rect.width,
      rect.height,
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    );
    if (!hit) return null;
    const [x, , z] = clampRadial(hit.x, hit.z, MAX_RADIUS);
    return [x, 0, z];
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!draggingFlowerId) return;
    const pos = projectToBoard(e.clientX, e.clientY);
    if (pos) setGhost({ position: pos });
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // dragleave fires when moving to a child too — clear only when the
    // pointer really leaves the wrapper element.
    if (e.currentTarget === e.target) setGhost(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setGhost(null);
    const id = e.dataTransfer.getData('application/x-florist-flower') as FlowerId;
    if (!id) return;
    const pos = projectToBoard(e.clientX, e.clientY);
    if (pos) onAdd(id, pos);
  };

  /* -------- Save handlers ----------------------------------------------
     Both PNG and GLB temporarily hide any editing overlays (wireframe /
     handles) via a scene traversal instead of state, so nothing has to
     re-render before the export runs.
     ------------------------------------------------------------------- */

  const withOverlaysHidden = useCallback(
    (fn: () => void, forceRender = false) => {
      if (!canvasState.current || !bouquetRef.current) return;
      const hidden: THREE.Object3D[] = [];
      bouquetRef.current.traverse((obj) => {
        if (obj.userData?.exportSkip && obj.visible) {
          hidden.push(obj);
          obj.visible = false;
        }
      });
      try {
        if (forceRender) {
          const { gl, scene, camera } = canvasState.current;
          gl.render(scene, camera);
        }
        fn();
      } finally {
        hidden.forEach((o) => (o.visible = true));
      }
    },
    []
  );

  const savePng = useCallback(() => {
    if (!canvasState.current) return;
    withOverlaysHidden(() => {
      const dataUrl = canvasState.current!.gl.domElement.toDataURL('image/png');
      downloadDataUrl(dataUrl, `bouquet-${timestamp()}.png`);
    }, true);
  }, [withOverlaysHidden]);

  const saveGlb = useCallback(() => {
    if (!bouquetRef.current) return;
    withOverlaysHidden(() => {
      const exporter = new GLTFExporter();
      exporter.parse(
        bouquetRef.current!,
        (result) => {
          if (result instanceof ArrayBuffer) {
            const blob = new Blob([result], { type: 'model/gltf-binary' });
            downloadBlob(blob, `bouquet-${timestamp()}.glb`);
          } else {
            const blob = new Blob([JSON.stringify(result)], { type: 'model/gltf+json' });
            downloadBlob(blob, `bouquet-${timestamp()}.gltf`);
          }
        },
        (err) => console.error('GLB export failed:', err),
        { binary: true, onlyVisible: true }
      );
    });
  }, [withOverlaysHidden]);

  const bouquetEmpty = placed.length === 0 && vessel.kind === 'none';

  return (
    <div className="board-wrap">
      <div className="board-toolbar">
        <div className="board-toolbar-left">
          <span className="tool-label">View</span>
          <button className="tool-btn" onClick={resetView} title="Reset camera">⟲</button>
          <span className="tool-divider" />
          <label className="color-swatch" title="Board disc colour">
            <span className="color-swatch-label">Board</span>
            <input
              type="color"
              value={boardColor}
              onChange={(e) => onBoardColorChange(e.target.value)}
            />
            <span className="color-swatch-chip" style={{ background: boardColor }} />
          </label>
          <label className="color-swatch" title="Background colour">
            <span className="color-swatch-label">Background</span>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
            />
            <span className="color-swatch-chip" style={{ background: backgroundColor }} />
          </label>
        </div>
        <div className="board-toolbar-right">
          <span className="tool-label">
            Drag flower to move · drag corners to resize · drag top handle to tilt
          </span>
        </div>
      </div>

      <div
        ref={wrapRef}
        className={`board-stage ${draggingFlowerId ? 'is-dragging' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Canvas
          shadows
          camera={{ position: [4.5, 4, 6.5], fov: 42 }}
          dpr={[1, 2]}
          gl={{ preserveDrawingBuffer: true, antialias: true }}
          onPointerMissed={() => onSelect(null)}
        >
          <color attach="background" args={[backgroundColor]} />

          <ambientLight intensity={0.35} />
          <hemisphereLight args={['#fff8ef', '#c9b98a', 0.4]} />
          <directionalLight
            position={[6, 9, 5]}
            intensity={1.15}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
          />
          <directionalLight position={[-5, 4, -3]} intensity={0.35} color="#e8d5a8" />

          <Suspense fallback={<LoadingFallback />}>
            <Environment preset="studio" />
          </Suspense>

          <BoardSurface color={boardColor} />
          <ContactShadows
            position={[0, 0.001, 0]}
            opacity={0.35}
            scale={12}
            blur={2.5}
            far={5}
            resolution={1024}
          />

          {/* Everything that should end up in the exported GLB lives inside
              this group. Board disc, environment, shadows, and helpers are
              intentionally outside so the exported file is just the bouquet. */}
          <group ref={bouquetRef}>
            <Suspense fallback={null}>
              {vessel.kind === 'vase' && (
                <group scale={vessel.scale}>
                  <Vase3D id={vessel.id} />
                </group>
              )}
              {vessel.kind === 'wrap' && (
                <group scale={vessel.scale}>
                  <Wrap3D id={vessel.id} />
                </group>
              )}
            </Suspense>

            {placed.map((pf) => (
              <Suspense key={pf.uid} fallback={<StemPlaceholder position={pf.position} />}>
                <PlacedFlower3D
                  placed={pf}
                  selected={selection?.kind === 'flower' && selection.uid === pf.uid}
                  onSelectFlower={(uid) => {
                    onSelect({ kind: 'flower', uid });
                    onBringForward(uid);
                  }}
                  onDragStart={() => setOrbitEnabled(false)}
                  onDragEnd={() => setOrbitEnabled(true)}
                  onSetPosition={(pos) => onSetPosition(pf.uid, pos)}
                  onSetRotationY={(r) => onSetRotationY(pf.uid, r)}
                  onSetTilt={(tx, tz) => onSetTilt(pf.uid, tx, tz)}
                  onSetScale={(s) => onSetScale(pf.uid, s)}
                  onDelete={() => onRemove(pf.uid)}
                />
              </Suspense>
            ))}
          </group>

          {bouquetEmpty && !draggingFlowerId && <EmptyHint />}

          {draggingFlowerId && ghost && (
            <DropPreview
              position={ghost.position}
              tint={
                FLOWERS.find((f) => f.id === draggingFlowerId)?.tint ?? '#f5b301'
              }
            />
          )}

          <OrbitControls
            ref={controlsRef}
            enabled={orbitEnabled}
            enablePan
            enableDamping
            dampingFactor={0.08}
            minDistance={2.5}
            maxDistance={22}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            target={[0, 1.2, 0]}
          />

          <CanvasBridge stateRef={canvasState} />
        </Canvas>

        <div className="save-panel">
          <button
            className="save-btn save-btn-primary"
            onClick={savePng}
            disabled={bouquetEmpty}
            title="Download the current view as a photo"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5h4l2-2h6l2 2h4v14H3z M12 10a4 4 0 100 8 4 4 0 000-8z"
              />
            </svg>
            <span>Photo</span>
          </button>
          <button
            className="save-btn"
            onClick={saveGlb}
            disabled={bouquetEmpty}
            title="Download a 3D model of just the bouquet (.glb)"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l9 5-9 5-9-5 9-5z M3 8v8l9 5 9-5V8 M12 13v8"
              />
            </svg>
            <span>3D model</span>
          </button>
        </div>

        <div className="orbit-hint">
          <strong>Drag scene</strong> to orbit · <strong>scroll</strong> to zoom ·
          <strong> right-drag</strong> to pan.
          <br />
          Drag a flower to move it (rotate the scene to a side view to lift it up
          or down). Drag the top handle to tilt, corners to resize. Click a
          selected flower again to select whichever one is behind it.
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   File-download helpers
   ================================================================ */

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  triggerDownload(dataUrl, filename);
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ================================================================
   Shared raycast helpers — grip-offset dragging model
   ================================================================ */

function raycastToPlane(
  camera: THREE.Camera,
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
  plane: THREE.Plane
): THREE.Vector3 | null {
  const ndc = new THREE.Vector2(
    (offsetX / width) * 2 - 1,
    -(offsetY / height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);
  const hit = new THREE.Vector3();
  return raycaster.ray.intersectPlane(plane, hit) ? hit : null;
}

function pointerToPlane(
  e: { clientX: number; clientY: number },
  gl: THREE.WebGLRenderer,
  camera: THREE.Camera,
  plane: THREE.Plane
): THREE.Vector3 | null {
  const rect = gl.domElement.getBoundingClientRect();
  return raycastToPlane(
    camera,
    e.clientX - rect.left,
    e.clientY - rect.top,
    rect.width,
    rect.height,
    plane
  );
}

/**
 * Build the plane that faces the camera and passes through `point`.
 * Used for body drag: cursor moves along this plane so dragging feels
 * like translating a photograph in 2D screen-space, but it maps into
 * real 3D world coordinates. When the camera looks down, the plane is
 * mostly horizontal (XZ); when it looks sideways, the plane is mostly
 * vertical (allowing lifts along Y just by dragging up on screen).
 */
function cameraFacingPlane(camera: THREE.Camera, point: THREE.Vector3): THREE.Plane {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  return new THREE.Plane().setFromNormalAndCoplanarPoint(forward.negate(), point);
}

function clampRadial(x: number, z: number, maxR: number): [number, number, number] {
  const r = Math.hypot(x, z);
  if (r > maxR) return [(x * maxR) / r, 0, (z * maxR) / r];
  return [x, 0, z];
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/* ================================================================
   Placed flower — tilt → yaw → scale
   ================================================================ */

interface PlacedProps {
  placed: PlacedFlowerT;
  selected: boolean;
  onSelectFlower: (uid: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onSetPosition: (pos: [number, number, number]) => void;
  onSetRotationY: (rotationY: number) => void;
  onSetTilt: (tiltX: number, tiltZ: number) => void;
  onSetScale: (scale: number) => void;
  onDelete: () => void;
}

function findOtherFlowerUid(
  intersections: any[] | undefined,
  excludeUid: string
): string | null {
  if (!intersections) return null;
  for (const hit of intersections) {
    let obj: THREE.Object3D | null = hit.object ?? null;
    while (obj) {
      const uid = obj.userData?.flowerUid as string | undefined;
      if (uid && uid !== excludeUid) return uid;
      obj = obj.parent;
    }
  }
  return null;
}

function PlacedFlower3D({
  placed,
  selected,
  onSelectFlower,
  onDragStart,
  onDragEnd,
  onSetPosition,
  onSetTilt,
  onSetScale,
  onDelete,
}: PlacedProps) {
  const { camera, gl } = useThree();

  /* -------- Body drag: camera-plane translation with grip offset --------
     - onPointerDown: freeze a plane facing the camera through the flower's
       current world position. Record cursor-on-plane and flower position.
     - onPointerMove: raycast to the same plane. delta = newCursor - startCursor.
       newFlowerPos = startPos + delta. Clamp Y ≥ 0 and XZ within board radius.
     Because the delta is 0 at drag start, a click without motion never moves
     the flower — which fixes the "snaps to the board edge" bug.
     ------------------------------------------------------------------- */
  const bodyDrag = useRef<{
    plane: THREE.Plane;
    startCursor: THREE.Vector3;
    startPos: THREE.Vector3;
  } | null>(null);

  // Click-intent tracking. If a click doesn't move the pointer and the flower
  // was already selected, cycle selection to the next flower behind this one.
  const clickIntent = useRef<{
    wasSelected: boolean;
    intersections: any[];
    moved: boolean;
    startX: number;
    startY: number;
  } | null>(null);

  const handleBodyDown = (e: any) => {
    e.stopPropagation();
    clickIntent.current = {
      wasSelected: selected,
      intersections: e.intersections ?? [],
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
    };
    onSelectFlower(placed.uid);
    const start = new THREE.Vector3(...placed.position);
    const plane = cameraFacingPlane(camera, start);
    const cursor = pointerToPlane(e, gl, camera, plane);
    if (!cursor) return;
    bodyDrag.current = { plane, startCursor: cursor.clone(), startPos: start };
    onDragStart();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    gl.domElement.style.cursor = 'grabbing';
  };
  const handleBodyMove = (e: any) => {
    if (clickIntent.current) {
      const dx = e.clientX - clickIntent.current.startX;
      const dy = e.clientY - clickIntent.current.startY;
      if (dx * dx + dy * dy > 25) clickIntent.current.moved = true;
    }
    if (!bodyDrag.current) return;
    e.stopPropagation();
    const cursor = pointerToPlane(e, gl, camera, bodyDrag.current.plane);
    if (!cursor) return;
    const { startCursor, startPos } = bodyDrag.current;
    const dx = cursor.x - startCursor.x;
    const dy = cursor.y - startCursor.y;
    const dz = cursor.z - startCursor.z;
    const nx = startPos.x + dx;
    const ny = clamp(startPos.y + dy, 0, MAX_HEIGHT);
    const nz = startPos.z + dz;
    const [cx, , cz] = clampRadial(nx, nz, MAX_RADIUS);
    onSetPosition([cx, ny, cz]);
  };
  const handleBodyUp = (e: any) => {
    e.stopPropagation();
    if (bodyDrag.current) {
      bodyDrag.current = null;
      onDragEnd();
      gl.domElement.style.cursor = '';
    }
    // If this was a plain click (no drag) on an already-selected flower,
    // try to cycle to another flower that was under the cursor at click time.
    const intent = clickIntent.current;
    clickIntent.current = null;
    if (intent && !intent.moved && intent.wasSelected) {
      const otherUid = findOtherFlowerUid(intent.intersections, placed.uid);
      if (otherUid) onSelectFlower(otherUid);
    }
  };

  return (
    <group position={placed.position} userData={{ flowerUid: placed.uid }}>
      {/* Tilt applied in world frame — dragging the tilt handle in a given
          world direction leans the flower that way regardless of yaw. */}
      <group rotation={[placed.tiltX, 0, placed.tiltZ]}>
        <group rotation-y={placed.rotationY}>
          <group
            scale={placed.scale}
            onPointerDown={handleBodyDown}
            onPointerMove={handleBodyMove}
            onPointerUp={handleBodyUp}
            onPointerCancel={handleBodyUp}
          >
            <Flower3D flowerId={placed.flowerId} selected={selected} />
          </group>

          {selected && <SelectionWireframe scale={placed.scale} />}

          {selected && (
            <>
              <CornerHandles
                scale={placed.scale}
                stemBase={placed.position}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onSetScale={onSetScale}
              />
              <TiltHandle
                scale={placed.scale}
                stemBase={placed.position}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onSetTilt={onSetTilt}
              />
              <FloatingFlowerToolbar
                anchorY={BOX_H * placed.scale + 0.9}
                onDelete={onDelete}
              />
            </>
          )}
        </group>
      </group>
    </group>
  );
}

/* ================================================================
   Selection wireframe — 12 line edges only. Corner handles come from
   <CornerHandles> so they carry their own pointer events.
   ================================================================ */

function SelectionWireframe({ scale }: { scale: number }) {
  const w = BOX_W * scale;
  const h = BOX_H * scale;
  const d = BOX_D * scale;
  const edges = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    [w, h, d]
  );
  return (
    <lineSegments
      geometry={edges}
      position={[0, h / 2, 0]}
      renderOrder={999}
      userData={{ exportSkip: true }}
    >
      <lineBasicMaterial color="#f5b301" transparent opacity={0.9} depthTest={false} />
    </lineSegments>
  );
}

/* ================================================================
   Corner handles — the corner sticks to the cursor. Uses grip-offset
   scaling so the initial grab-point is preserved for the whole drag.
   ================================================================ */

function CornerHandles({
  scale,
  stemBase,
  onDragStart,
  onDragEnd,
  onSetScale,
}: {
  scale: number;
  stemBase: [number, number, number];
  onDragStart: () => void;
  onDragEnd: () => void;
  onSetScale: (scale: number) => void;
}) {
  const w = BOX_W * scale;
  const h = BOX_H * scale;
  const d = BOX_D * scale;
  const hw = w / 2, hh = h / 2, hd = d / 2;

  const corners: [number, number, number][] = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        corners.push([sx * hw, hh + sy * hh, sz * hd]);
      }
    }
  }

  const handleSize = Math.max(0.09, Math.min(w, h, d) * 0.07);

  return (
    <group renderOrder={1000} userData={{ exportSkip: true }}>
      {corners.map((pos, i) => (
        <CornerHandle
          key={i}
          position={pos}
          size={handleSize}
          scale={scale}
          stemBase={stemBase}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onSetScale={onSetScale}
        />
      ))}
    </group>
  );
}

function CornerHandle({
  position,
  size,
  scale,
  stemBase,
  onDragStart,
  onDragEnd,
  onSetScale,
}: {
  position: [number, number, number];
  size: number;
  scale: number;
  stemBase: [number, number, number];
  onDragStart: () => void;
  onDragEnd: () => void;
  onSetScale: (scale: number) => void;
}) {
  const { camera, gl } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);

  const drag = useRef<{
    grip: number;         // projected (cursor - stem) - projected (corner - stem), signed
    refDist: number;      // full-3D corner-to-stem distance at scale = 1
    dir: THREE.Vector3;   // frozen unit direction from stem to corner in world (3D)
    plane: THREE.Plane;   // camera-facing plane through the corner at drag start
  } | null>(null);

  const worldOf = (obj: THREE.Object3D | null) => {
    const v = new THREE.Vector3();
    obj?.getWorldPosition(v);
    return v;
  };

  const handleDown = (e: any) => {
    e.stopPropagation();
    const cornerWorld = worldOf(meshRef.current);
    const stem = new THREE.Vector3(...stemBase);
    // Full 3D direction from base to corner — this includes the Y component,
    // so tilted flowers still project outward correctly.
    const dir3 = cornerWorld.clone().sub(stem);
    const cornerDist = dir3.length();
    if (cornerDist < 0.02) return;
    dir3.divideScalar(cornerDist);
    const refDist = cornerDist / scale;

    // Camera-facing plane keeps the raycast stable regardless of view angle,
    // where a horizontal plane can flip / go unstable near horizontal camera.
    const plane = cameraFacingPlane(camera, cornerWorld);
    const cursor = pointerToPlane(e, gl, camera, plane);
    // Project (cursor - stem) onto the corner's 3D diagonal direction.
    const cursorProj = cursor ? cursor.clone().sub(stem).dot(dir3) : cornerDist;

    drag.current = {
      grip: cursorProj - cornerDist,
      refDist,
      dir: dir3,
      plane,
    };
    onDragStart();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    gl.domElement.style.cursor = 'nwse-resize';
  };

  const handleMove = (e: any) => {
    if (!drag.current) return;
    e.stopPropagation();
    const stem = new THREE.Vector3(...stemBase);
    const cursor = pointerToPlane(e, gl, camera, drag.current.plane);
    if (!cursor) return;
    const cursorProj = cursor.clone().sub(stem).dot(drag.current.dir);
    const targetCornerDist = cursorProj - drag.current.grip;
    const newScale = targetCornerDist / drag.current.refDist;
    onSetScale(clamp(newScale, 0.25, 3.2));
  };

  const handleUp = (e: any) => {
    if (!drag.current) return;
    e.stopPropagation();
    drag.current = null;
    onDragEnd();
    gl.domElement.style.cursor = '';
  };

  const s = size * (hover ? 1.4 : 1);
  return (
    <mesh
      ref={meshRef}
      position={position}
      renderOrder={1001}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        gl.domElement.style.cursor = 'nwse-resize';
      }}
      onPointerOut={() => {
        setHover(false);
        if (!drag.current) gl.domElement.style.cursor = '';
      }}
    >
      <boxGeometry args={[s, s, s]} />
      <meshBasicMaterial color={hover ? '#ffcf3b' : '#f5b301'} depthTest={false} />
    </mesh>
  );
}

/* ================================================================
   Tilt handle — the ONE rotation control. It's a sphere at the top
   of the wireframe; drag it in any horizontal direction and the top
   of the flower follows the cursor, so the flower leans over that
   way. Uses exact spherical math so the handle stays glued to the
   cursor throughout the drag.
   ================================================================ */

function TiltHandle({
  scale,
  stemBase,
  onDragStart,
  onDragEnd,
  onSetTilt,
}: {
  scale: number;
  stemBase: [number, number, number];
  onDragStart: () => void;
  onDragEnd: () => void;
  onSetTilt: (tiltX: number, tiltZ: number) => void;
}) {
  const { camera, gl } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);

  const drag = useRef<{
    grip: { dx: number; dz: number };
    plane: THREE.Plane;
    H: number;
  } | null>(null);

  const topLocalY = BOX_H * scale;

  const handleDown = (e: any) => {
    e.stopPropagation();
    // Current world position of the handle (accounts for existing tilt + yaw).
    const sphereWorld = new THREE.Vector3();
    meshRef.current?.getWorldPosition(sphereWorld);
    // Camera-facing plane through the handle — stable regardless of camera
    // angle. Grip records where on the sphere the cursor grabbed, so the
    // sphere stays glued to the cursor throughout the drag.
    const plane = cameraFacingPlane(camera, sphereWorld);
    const cursor = pointerToPlane(e, gl, camera, plane);
    const grip = cursor
      ? { dx: cursor.x - sphereWorld.x, dz: cursor.z - sphereWorld.z }
      : { dx: 0, dz: 0 };
    drag.current = {
      grip,
      plane,
      H: BOX_H * scale, // sphere distance from base = wireframe height
    };
    onDragStart();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    gl.domElement.style.cursor = 'move';
  };

  const handleMove = (e: any) => {
    if (!drag.current) return;
    e.stopPropagation();
    const stem = new THREE.Vector3(...stemBase);
    const cursor = pointerToPlane(e, gl, camera, drag.current.plane);
    if (!cursor) return;
    // Target world XZ of the sphere = cursor minus initial grip offset.
    const targetX = cursor.x - drag.current.grip.dx;
    const targetZ = cursor.z - drag.current.grip.dz;
    let dx = targetX - stem.x;
    let dz = targetZ - stem.z;

    // The sphere can never leave a horizontal circle of radius H around the
    // base. Clamp just inside so the asin math never saturates at ±90°.
    const H = drag.current.H;
    const maxR = H * 0.9;
    const r = Math.hypot(dx, dz);
    if (r > maxR) {
      dx = (dx * maxR) / r;
      dz = (dz * maxR) / r;
    }

    // Three's default 'XYZ' Euler applies rotation as R = Rx · Rz when
    // applied to a column vector — Rz first, then Rx. Starting from (0, H, 0):
    //   after Rz(θz): (-H·sinθz, H·cosθz, 0)
    //   after Rx(θx): (-H·sinθz, H·cosθz·cosθx, H·cosθz·sinθx)
    // So the horizontal offset (dx, dz) of the sphere satisfies:
    //   dx = -H·sinθz              →  θz = asin(-dx / H)
    //   dz =  H·cosθz·sinθx        →  θx = asin(dz / (H·cosθz))
    // Solve tiltZ first, then use the resulting cosθz to solve tiltX.
    const sinZ = clamp(-dx / H, -1, 1);
    const cosZ = Math.sqrt(1 - sinZ * sinZ);
    const sinX = cosZ > 0.001 ? clamp(dz / (H * cosZ), -1, 1) : 0;
    onSetTilt(Math.asin(sinX), Math.asin(sinZ));
  };

  const handleUp = (e: any) => {
    if (!drag.current) return;
    e.stopPropagation();
    drag.current = null;
    onDragEnd();
    gl.domElement.style.cursor = '';
  };

  const r = hover ? 0.19 : 0.16;
  return (
    <group position={[0, topLocalY, 0]} renderOrder={1002} userData={{ exportSkip: true }}>
      {/* Tiny stalk connecting to the wireframe top so the sphere reads
          as "the top of the flower" instead of a random floating dot. */}
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.16, 8]} />
        <meshBasicMaterial color="#f5b301" depthTest={false} />
      </mesh>
      <mesh
        ref={meshRef}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          gl.domElement.style.cursor = 'move';
        }}
        onPointerOut={() => {
          setHover(false);
          if (!drag.current) gl.domElement.style.cursor = '';
        }}
      >
        <sphereGeometry args={[r, 24, 18]} />
        <meshBasicMaterial color={hover ? '#ffcf3b' : '#f5b301'} depthTest={false} />
      </mesh>
    </group>
  );
}

/* ================================================================
   Floating toolbar — delete only. Everything else is on the
   wireframe itself so the interaction stays intuitive.
   ================================================================ */

interface ToolbarProps {
  anchorY: number;
  onDelete: () => void;
}

function FloatingFlowerToolbar({ anchorY, onDelete }: ToolbarProps) {
  const stop = (fn: () => void) => (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    fn();
  };
  return (
    <Html
      position={[0, anchorY, 0]}
      center
      zIndexRange={[200, 0]}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className="floating-toolbar"
        onPointerDown={(e) => e.stopPropagation()}
        onPointerMove={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}
      >
        <button className="ft-btn ft-danger" onClick={stop(onDelete)} title="Delete">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 13h10l1-13"
            />
          </svg>
        </button>
      </div>
    </Html>
  );
}

/* ================================================================
   Board furniture
   ================================================================ */

function BoardSurface({ color }: { color: string }) {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[6, 64]} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0} />
    </mesh>
  );
}

function StemPlaceholder({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.04, 0.05, 2.5, 8]} />
      <meshStandardMaterial color="#7a8a68" opacity={0.4} transparent />
    </mesh>
  );
}

function EmptyHint() {
  return (
    <Html center distanceFactor={10} position={[0, 1.6, 0]}>
      <div className="board-empty-hint">
      </div>
    </Html>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="loading">Loading 3D scene…</div>
    </Html>
  );
}

/* ================================================================
   Drop preview — semi-transparent silhouette shown at the projected
   ground position while a flower is being dragged from the palette.
   Lives outside the bouquet ref so it never leaks into a GLB export.
   ================================================================ */

function DropPreview({
  position,
  tint,
}: {
  position: [number, number, number];
  tint: string;
}) {
  return (
    <group position={position}>
      {/* Landing spot on the ground */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.58, 48]} />
        <meshBasicMaterial color={tint} transparent opacity={0.75} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.42, 48]} />
        <meshBasicMaterial color={tint} transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* Silhouette stem */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 2.7, 12]} />
        <meshBasicMaterial color="#3f7f3a" transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Silhouette bloom */}
      <mesh position={[0, 2.9, 0]}>
        <sphereGeometry args={[0.45, 24, 18]} />
        <meshBasicMaterial color={tint} transparent opacity={0.42} depthWrite={false} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * Math.PI * 2) / 6;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.28, 2.9, Math.sin(a) * 0.28]}
          >
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshBasicMaterial color={tint} transparent opacity={0.32} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function CanvasBridge({
  stateRef,
}: {
  stateRef: React.MutableRefObject<{
    camera: THREE.Camera;
    gl: THREE.WebGLRenderer;
    scene: THREE.Scene;
  } | null>;
}) {
  const { camera, gl, scene } = useThree();
  useFrame(() => {
    stateRef.current = { camera, gl, scene };
  });
  return null;
}
