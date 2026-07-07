# Florist Studio — Project Journal

A full record of building this app: what we set out to do, how it evolved, what worked, what did not, and every trap along the way. Written so you can revisit the *why* behind the code, not just the *what*.

**Companion docs:** [`README.md`](../README.md) for setup and feature list.

---

## 0. What we were building

A workshop for florists — pick flowers, pick a vessel, arrange the stems in 3D, and save the result before touching a real stem. The goal is to **save time and money**: try the arrangement digitally, orbit it from every angle, then cut real stems once the design is right.

The product went through three major phases:

| Phase | What it looked like | Why it changed |
| --- | --- | --- |
| **1 — 2D mockup** | SVG flowers on a flat board, CSS tricks for “rotation”, side panels for palette and vessels | Looked like clip-art; florists need stems, scale, and believable silhouettes |
| **2 — Full 3D** | Three.js + React Three Fiber, user-provided `.glb` scans, orbit-by-dragging the scene | Met the “graphics MUST be 3D” requirement; interaction was still rough |
| **3 — Polished workshop** | Canva-style wireframes, tilt/resize/move, click-cycling, save PNG/GLB, tutorial, drag ghost | Each round of real use exposed a specific bug or UX gap |

### Requirements that stayed constant

- **Vase OR wrap OR neither** — never both at once.
- **Flowers include stems** — not just floating heads.
- **Large design canvas** — the board dominates the layout.
- **No work tickets / per-stem pricing** (removed early).
- **Real 3D only** — procedural placeholder flowers were removed; the catalog is your 18 Sketchfab scans.

### Requirements that evolved with feedback

| User ask | What we built |
| --- | --- |
| “Rotate the bouquet by dragging” | `OrbitControls` with full 360° polar angle (view from above/below) |
| “Use my `.glb` files” | `Flower3D` + `public/models/flowers/` + catalog entries with credits |
| “Get rid of the Rubik’s cubes” | `stripReferenceCubes()` in `Flower3D.tsx` |
| “Edit like Canva — outline stays until deselect” | Persistent gold wireframe + corner handles |
| “Rotate means *tilt*, not spin” | Removed yaw knob; gold sphere at top for tilt drag |
| “Vases/wraps not editable on board” | Size slider in `VesselPanel` only |
| “Flowers jump to the edge when I drag” | Grip-offset camera-plane body drag |
| “Resize inverts sometimes” | Full 3D direction vector + camera-facing plane for corners |
| “Hard to pick overlapping flowers” | Click-cycling via `e.intersections` |
| “Only my 3D flowers, no placeholders” | Trimmed catalog to 18 GLB entries |
| “Customise board/background, save photo + 3D” | Colour pickers, `GLTFExporter`, `preserveDrawingBuffer` |
| “No blur when zooming out” | Removed scene `<fog>` |
| “Silhouette while dragging, click to add, tutorial” | `DropPreview`, golden-angle spiral, `TutorialOverlay` |

---

## 0.1 What *you* learned (the big ideas)

You do not need to read Three.js source to take these away:

1. **3D on the web is a different product category from 2D.** A beautiful 2D florist UI does not “upgrade” to 3D — it gets rebuilt. Interaction, performance, and assets all change.

2. **Real assets beat procedural art for this use case.** Photogrammetry scans from Sketchfab (ffish.asia, etc.) are what make the app credible. Procedural spheres-and-cylinders were fine for dev, wrong for florists.

3. **GLB files are not plug-and-play.** Scans ship with scale cubes, multiple plants in one file, odd origins, and huge file sizes. You need cleanup (`stripReferenceCubes`), normalisation (`normalizeToGround`), and sometimes `modelNode` to split one file into several palette entries.

4. **“Feels broken” usually means bad coordinate math, not bad graphics.** Flowers jumping to the edge, resize inverting, tilt jitter — all turned out to be raycasting and Euler-order bugs, not rendering quality.

5. **One interaction pattern solves most of 3D editing.** “Freeze a camera-facing plane on pointer down, keep the grip offset, apply deltas” is the secret behind move, resize, and tilt feeling 1:1.

6. **Export is a boundary problem.** Deciding what lives inside `bouquetRef` (flowers + vessel) vs outside (board, lights, UI overlays) is what makes “save 3D model” mean *bouquet*, not *entire editor*.

7. **Performance is an asset strategy.** Preloading ~600 MB of GLBs on startup made the app feel dead. Lazy load per flower + drei cache = fast first paint, acceptable first placement.

8. **Onboarding is part of the feature.** A 3D editor with drag, tilt, click-cycling, and two save formats is not discoverable without a short tutorial.

---

## 1. The stack, and why each piece is there

| Layer | Choice | Why |
| --- | --- | --- |
| UI framework | **React 18 + TypeScript + Vite 5** | Familiar, fast HMR, and TypeScript keeps the 3D transform math honest. |
| 3D renderer | **Three.js via `@react-three/fiber` v8** | Declarative Three inside React. **v9 requires React 19** — this was the very first version pin problem I hit (see §4.1). |
| 3D helpers | **`@react-three/drei` v9** | `OrbitControls`, `Environment`, `ContactShadows`, `useGLTF`, `Html` — all the boring plumbing. |
| Exports / types | **`three-stdlib`** | Ships `GLTFExporter` and clean TS types for `OrbitControls` in one package. |
| Assets | **`.glb` scans from Sketchfab** (CC0 / CC-BY) | Real-world flowers look real; procedural blooms always look like clip-art. |
| Backend | **Express + tsx watch** | Scaffolded for persistence. Not required for the current UI to work. |

---

## 2. Architectural highlights (the parts you'll want to reuse)

### 2.1 Everything is a React component, including the scene

Three.js scenes get gnarly quickly. Wrapping them in React means the same declarative `props → render` mental model applies to a 3D flower as to a `<div>`. State lives in `App.tsx`; the board just projects it.

```
App.tsx  ──── placed[], vessel, selection, colours, draggingFlowerId, tutorialSeen
   │
   ├── FlowerPalette         (drag start / drag end / click-to-add)
   ├── DesignBoard3D         (renders the scene, owns the ghost + save handlers)
   ├── VesselPanel           (vase/wrap picker + size slider)
   ├── Header                (stem count + Clear + Tutorial button)
   └── TutorialOverlay
```

### 2.2 One `bouquetRef` group is the source of truth for "the arrangement"

Every mesh you should be able to export or screenshot lives inside a single `<group ref={bouquetRef}>`. The board disc, environment, contact shadows, orbit controls, and the drag ghost sit **outside** it. This one boundary is what makes the GLB export "just the flowers and vessel" without any per-object opt-in.

### 2.3 Overlays are marked, not restructured

Selection wireframes, corner scale handles, and the gold tilt sphere all live *inside* their flower group (so they inherit the tilt/yaw/scale transforms), but they carry `userData={{ exportSkip: true }}`. Before either save action runs, the export code walks the bouquet, records anything with that flag, sets `visible = false`, then restores it. No React re-render needed, no `flushSync`, no context.

### 2.4 Grip-offset dragging everywhere

Almost every 3D interaction in this app is built on the same pattern:

1. On pointer down, freeze a **camera-facing plane** through the object's current world position.
2. Record the offset between the cursor's projected point and the object's anchor.
3. On every pointer move, re-project the cursor onto that plane and translate by the delta, keeping the offset.

This is what makes body drag, corner resize, and the tilt handle all feel 1:1. Every previous non-1:1 attempt (see §4.5 – §4.7) had bugs.

---

## 3. Concepts I actually understood by the end of this

- **Raycasting into a WebGL scene.** How to convert `(clientX, clientY)` into a normalised device coordinate, build a `THREE.Raycaster`, intersect with a mathematical `THREE.Plane`, and get a world-space hit point. Powers drop placement, drag movement, and the ghost silhouette.
- **Camera-facing planes vs. horizontal planes.** A horizontal (`y = 0`) plane is unstable when the camera is roughly level with it — small pointer moves translate to enormous world jumps. A plane whose normal is the camera-to-object direction is bounded and always well-behaved.
- **Three's Euler convention (`XYZ` = Rz then Rx then Ry when applied to a column vector).** The formulas in §4.7 only work because we solve `tiltZ` first (from the horizontal `x` displacement) and then `tiltX` given that (from the horizontal `z` displacement). Swapping the order silently gives wrong angles.
- **Golden-angle spiral (`≈ 137.5°`)** for packing points evenly on a disc. Used by the click-to-add layout so repeated clicks fan out instead of stacking.
- **GLTF export flow via `GLTFExporter`.** Passing any `Object3D`, `{ binary: true, onlyVisible: true }`, and downloading the resulting `ArrayBuffer` as an `.glb`. The `onlyVisible` flag is what lets the `exportSkip` trick above work without touching the scene graph structure.
- **`preserveDrawingBuffer` for canvas screenshots.** Without it, `gl.domElement.toDataURL()` gives you a blank image because the buffer has been swapped since the last frame.
- **HTML5 drag-and-drop's information asymmetry.** `dataTransfer.getData()` returns nothing during `dragover` — only on `drop`. That is why the drag ghost needed a side-channel (`draggingFlowerId` in App state) to know which flower to preview.
- **Suspense-driven asset loading.** Each `Flower3D` suspends until its `.glb` streams in; drei caches the parsed model so the next placement is instant. Nothing else needs to know about the loading state.
- **Object cloning in Three.js.** `scene.clone(true)` makes a deep copy that shares geometry/material buffers but has independent transforms — critical when the same `.glb` powers multiple placed stems.

---

## 4. Mistakes and struggles, in the order they happened

Each entry: **what I tried → why it failed → what I actually did**.

### 4.1 `npm install` blew up on `@react-three/fiber`

- **What I tried:** grabbed the latest of everything — `@react-three/fiber@^9`.
- **Why it failed:** v9 requires React 19. The project is on React 18, so `npm` refused to resolve the tree.
- **Fix:** pinned `@react-three/fiber@^8.17.10` and `@react-three/drei@^9.117.3`. They form a matched pair against React 18. Lesson: always cross-check the React peer-dep range before jumping a major.

### 4.2 The mystery Rubik's cubes inside every GLB

- **What I saw:** every `ffish.asia` flower scan came with a tiny multicolour cube hovering next to the plant.
- **Why:** it's a scale reference marker baked into the scan.
- **Fix:** `stripReferenceCubes()` in `Flower3D.tsx`. It removes any node whose name matches `_?cube(_\d+)?` **and** any tiny disconnected mesh whose bounding box is roughly cube-shaped (`sy/sx < 1.25 && sz/sx < 1.25 && length < 0.15`). The dual heuristic catches both the named-cube case and the "someone renamed it but it's still cube-like" case.

### 4.3 Multiple flowers hiding inside one GLB

- **What I saw:** one Sketchfab file contained three roses under a single scene root.
- **Fix:** added `modelUrl` + `modelNode` to `FlowerMeta`. `Flower3D` looks up the named subtree via `findNodeByName`, clones just that node, and normalises it. Wrote `frontend/scripts/inspect-glb.mjs` to dump the node graph so I can find the right node names without opening Blender.

### 4.4 The gold wireframe vanished the moment I released the mouse

- **What I tried:** put a giant invisible `BackgroundClick` mesh at the back of the scene with `onClick={() => onSelect(null)}` so clicking empty space would deselect.
- **Why it failed:** the click event fired on *pointer up* — even if I clicked on a flower, `pointerdown` bubbled to the flower and set selection, but then `pointerup` bubbled to the background mesh and immediately cleared it.
- **Fix:** deleted the background mesh entirely. Put `onPointerMissed={() => onSelect(null)}` on the `<Canvas>` itself. That is R3F's built-in "clicked nothing" hook and it fires only when *no* interactive object was hit.

### 4.5 Dragging a flower snapped it to the edge of the board

- **What I tried:** on pointer move, raycast the cursor to the ground plane (`y = 0`) and set the flower's position to the hit point.
- **Why it failed:** when the user clicked on the *top* of a tall flower, the cursor's ray hit the ground far beyond the base — so the very first frame of the drag teleported the flower to wherever that ray hit, often the outer edge of the board.
- **Fix:** grip-offset camera-plane translation (see §2.4). On `pointerdown`, snapshot both the flower's starting position and the cursor's projected point on a camera-facing plane. On every move, apply the *delta*, so the initial grip is preserved and the flower never jumps.
- **Bonus:** the same maths gave us Y-axis movement for free — angle the scene sideways and vertical mouse motion lifts the stem up or down.

### 4.6 Corner resize inverted itself half the time

- **What I tried:** project the cursor onto the XZ diagonal from the flower's base to the corner, and set the scale from the projected length.
- **Why it failed:** when the flower was tilted, the corner's actual 3D direction from the base included a Y component. Projecting onto only XZ ignored that. When the camera was near-horizontal, projecting onto a horizontal plane amplified this until pulling *outward* actually shrank the flower.
- **Fix:** compute the corner's **full 3D direction vector** from the base (`cornerWorld.clone().sub(stem).normalize()`). Raycast the cursor onto a **camera-facing plane** through the corner, project the cursor's world-space offset onto the 3D direction, subtract the initial grip, divide by the reference distance at scale=1. Cursor and corner now track 1:1 at any tilt, any camera angle.

### 4.7 Tilting the flower was jittery and never quite where the cursor was

- **What I tried:** guessed the Euler angle formula — used `tiltX = asin(dz / H)` and `tiltZ = asin(-dx / H)` independently.
- **Why it failed:** Three's default `XYZ` Euler applies as `Rx · Ry · Rz` when multiplied against a column vector — meaning `Rz` runs *first*, not last. That means once there's a non-zero `tiltZ`, the effective horizontal displacement from `tiltX` is scaled by `cos(tiltZ)`. Solving the two angles independently gave a formula that only agreed with reality at the origin.
- **Fix:** solve `tiltZ` first from the horizontal `x` displacement (`sinZ = -dx / H`), then `tiltX` given that (`sinX = dz / (H * cosZ)`). Combined with the camera-facing-plane raycast, the gold sphere now sticks to the cursor throughout the entire drag.

### 4.8 Clicking a flower on top of another one was impossible

- **What I saw:** overlapping stems meant `raycaster` always returned the frontmost one. There was no way to grab the flower behind.
- **Fix:** **click-cycling.** Each flower's root group has `userData.flowerUid`. `PlacedFlower3D` keeps a `clickIntent` ref that records the initial pointer position and whether the drag moved. On `pointerup`, if there was no movement and the flower was already selected, walk `e.intersections` (which R3F populates with all raycast hits, not just the closest), find the next hit with a *different* `flowerUid`, and select that one. Repeat-click keeps rotating through the stack.

### 4.9 The scene turned into a fog bank when you zoomed out

- **What I had:** `<fog attach="fog" args={['#f4ecda', 14, 26]} />` on the scene. This is Three's linear fog — everything between 14 and 26 units from the camera fades to the fog colour. When you zoom out, everything crosses into the fog band and turns beige.
- **What the user said:** "Remove the effect when you zoom out of stage it blurs."
- **Fix:** just deleted that line. Removing fog also cleans up the exported GLB (fog is a per-scene setting so it wouldn't have exported anyway, but visually the previewer no longer felt "hazy").

### 4.10 The GLB export contained the yellow wireframe

- **What I tried:** call `GLTFExporter.parse(bouquetRef.current, ..., { binary: true })` right after clicking Export.
- **Why it failed:** if a flower was selected at export time, the wireframe / corner handles / tilt sphere were still in the scene. They ended up embedded in the `.glb`, which was noise, not a bouquet.
- **First fix I considered:** deselect via `setSelection(null)` and then export. But React's re-render is *not* synchronous, so the exporter would still run against the pre-deselect scene. Using `flushSync` would work but it felt heavy.
- **Actual fix:** all overlays are tagged `userData.exportSkip = true`. The export path walks the bouquet, sets `visible = false` on those nodes, exports with `{ onlyVisible: true }`, and restores visibility in a `finally` block. No React churn, no timing games.

### 4.11 Screenshots came out totally blank

- **What I tried:** `gl.domElement.toDataURL('image/png')` inside a Save Photo handler.
- **Why it failed:** WebGL swaps its front and back buffers every frame. By the time we call `toDataURL`, the buffer we could have read from is gone. Result: an empty PNG.
- **Fix:** set `gl={{ preserveDrawingBuffer: true, antialias: true }}` on the `<Canvas>`. This tells Three to keep the drawing buffer around after each frame. Small memory cost, huge behavioural win.

### 4.12 The drag ghost didn't know which flower to preview

- **What I tried:** read the flower id from the drag event during `dragover` (`e.dataTransfer.getData('application/x-florist-flower')`).
- **Why it failed:** `getData()` is blocked during `dragover` for security reasons — you only get the payload back at `drop`. The board had no idea what flower was flying over it.
- **Fix:** lifted a `draggingFlowerId` state up to `App.tsx`. `FlowerPalette` sets it in `onDragStart` and clears it in `onDragEnd`. The board projects the cursor to the ground plane during `dragover` and renders a tinted silhouette at that position, driven by `draggingFlowerId`.

### 4.13 The click-to-add pile

- **What I tried first:** click a palette card, drop a stem at `(0, 0, 0)`.
- **Why it failed:** click three times, you have three flowers occupying the exact same point.
- **Fix:** golden-angle spiral. Index `i` maps to `r = 0.62 · √i`, `angle = i · 137.5°`. Coordinates `(r·cos(angle), 0, r·sin(angle))` are approximately Poisson-disk distributed. But `i` isn't necessarily the number of stems — if the user deleted from the middle, the next `placed.length` could match an old slot. So instead of using `placed.length` as `i`, iterate `i = 0, 1, 2, …` and pick the first spot at least `MIN_DIST` from every currently-placed stem. Never stacks, even after aggressive deletion.

### 4.14 First-run experience was baffling

- **What I saw:** a new user landed on the app with a full 3D scene and no idea drag, click, tilt, colour, or save existed.
- **Fix:** a 5-step `TutorialOverlay` with SVG illustrations, a dot indicator, chevron nav, keyboard support (`Escape`, `←`, `→`), and a persistent `Skip`. Seen state stored in `localStorage` under `florist-tutorial-seen`. Re-openable from a Tutorial button in the header.

---

## 5. Design decisions that felt small but paid off

- **Lazy-load `.glb` files.** The original plan was to `useGLTF.preload(url)` every model on startup so placement would feel instant. With ~18 flowers totalling hundreds of megabytes, that ate the first 20 seconds of the app. Suspense + on-demand load means the app is interactive immediately; each flower streams in once, then drei caches it.
- **Vessels are not on-board editable.** Wireframes and drag handles live only on flowers. Vase and wrap sizing is a slider in the side panel. This one rule kept the interaction surface simple.
- **Empty-state hint has to hide during a drag.** Otherwise the "Drag flowers from the left…" copy fought with the silhouette. Trivial change, huge visual improvement.
- **`onPointerMissed` on the Canvas.** Do not build custom "clicked empty" backdrops.
- **`e.stopPropagation()` inside every 3D pointer handler.** Otherwise selecting a flower also fires the deselect handler on the parent scene.
- **`OrbitControls.enabled` toggled off during any manipulation.** Prevents scene-orbit and object-drag from fighting for the same drag stream.
- **Small SVG illustrations in the tutorial.** They were faster to author than actual screenshots and re-render for free at any DPI.

---

## 6. Things I would do differently next time

- **Start with the target interaction, not the visuals.** The 2D SVG version had beautiful cards but the interactions did not survive contact with real florists' needs. Rebuilding all of that once we jumped to 3D was slow.
- **Freeze camera-facing planes on `pointerdown` from the very first interaction.** I re-invented this pattern three times (body drag, corner resize, tilt) before extracting `cameraFacingPlane()` and `pointerToPlane()`. Doing it once, at the top, would have saved days.
- **Type the raycast state properly.** The `raycastState` / `canvasState` refs started as `{ camera }` and grew to `{ camera, gl, scene }`. Sharing a typed context or a small class would have been cleaner than the sequence of `stateRef` renames.
- **Write `inspect-glb.mjs` before I needed it, not after.** Investigating multi-object GLBs by opening files in Blender was slow. A 40-line Node script paid for itself the first time I ran it.
- **Add feature flags for asset preloading.** Big projects will want to preload their known-good top-10 models and lazy-load the long tail. The current code is all lazy; extracting a small "warm" list would be an easy win.
- **Move the catalog to the backend earlier.** Everything is in `frontend/src/data/catalog.ts` today. That is fine for a prototype but wants to be an API when there is a real inventory.

---

## 7. Concept cheat-sheet (for future you)

- Raycast: NDC `(x, y) = (2·px/W - 1, -(2·py/H - 1))`; feed to `Raycaster.setFromCamera(ndc, camera)`; `raycaster.ray.intersectPlane(plane, out)`.
- Camera-facing plane through point `P`: `new THREE.Plane().setFromNormalAndCoplanarPoint(cameraDirFrom(P), P)`.
- Golden angle in radians: `Math.PI * (3 - Math.sqrt(5))` ≈ `2.399`.
- Three Euler `XYZ` = `Rx · Ry · Rz` applied to a column vector.
- `GLTFExporter.parse(obj, onDone, onError, { binary: true, onlyVisible: true })` returns an `ArrayBuffer` in `onDone`.
- `<Canvas gl={{ preserveDrawingBuffer: true }}>` is required for `toDataURL` / `toBlob` screenshots.
- `onPointerMissed` on `<Canvas>` is the correct hook for "clicked empty space".
- `e.intersections` (R3F pointer events) contains every raycast hit, sorted by distance. Use it for click-cycling and any "which object behind me" logic.

---

## 8. Glossary of file names to open when a specific thing breaks

| Symptom | Look here |
| --- | --- |
| Drag from palette does the wrong thing | `FlowerPalette.tsx` (`handleDragStart`, `onDragEnd`), `App.tsx` (`draggingFlowerId`), `DesignBoard3D.tsx` (`handleDragOver`, `handleDrop`, `DropPreview`). |
| Click-to-add stacks or misplaces | `App.tsx` (`findClusterSpot`). |
| Flower jumps or moves weirdly | `PlacedFlower3D` in `DesignBoard3D.tsx` — the body drag handlers and `cameraFacingPlane`. |
| Corner resize is wrong | `CornerHandle` in `DesignBoard3D.tsx`. |
| Tilt is wrong | `TiltHandle` in `DesignBoard3D.tsx`. |
| Overlapping selection is stuck | `findOtherFlowerUid` + `clickIntent` in `DesignBoard3D.tsx`. |
| GLB export contains the wireframe | Every overlay needs `userData={{ exportSkip: true }}` and must sit inside `bouquetRef`. |
| Photo save is blank | `<Canvas gl={{ preserveDrawingBuffer: true }}>` — check it wasn't dropped. |
| Reference cubes show up again | `stripReferenceCubes()` in `Flower3D.tsx`. |
| Multiple flowers per GLB | `modelNode` in `catalog.ts` + `findNodeByName` in `Flower3D.tsx`. |
| Tutorial won't reopen | It's stored in `localStorage.florist-tutorial-seen`. Delete the key or click the Tutorial button in the header. |

---

_Written after the app reached "click a flower, drag a corner, save a PNG, open the GLB in Blender" — the point where the design goal was finally reachable in one sitting._

---

## 9. How to add a new flower (asset workflow)

1. **Drop the `.glb`** into `frontend/public/models/flowers/` (or keep a copy in `3d-flower-files/` as your source archive).
2. **Inspect the node graph** (especially if one file has multiple plants):
   ```bash
   cd frontend
   node scripts/inspect-glb.mjs public/models/flowers/your-flower.glb
   ```
3. **Register in the catalog** — `frontend/src/data/catalog.ts`:
   - Add an id to the `FlowerId` union in `frontend/src/types/index.ts`.
   - Add a `FlowerMeta` entry with `hasModel: true`, `tint` (for palette icon + drag ghost), and `credit` if required by license.
   - If the mesh lives inside a shared GLB: set `modelUrl` to the shared file and `modelNode` to the subtree name from step 2.
4. **Reload the dev server** — the new card appears in the palette automatically; no preload step required.
5. **Check in the scene:** no reference cube, stem sits on the board (Y=0), scale feels comparable to other flowers (~3 world units tall after `normalizeToGround`).

---

## 10. Current state (what works today)

| Area | Status |
| --- | --- |
| 18 real GLB flowers | ✅ Palette, drag, click-to-add, edit, export |
| 10 vases + 12 wraps (procedural 3D) | ✅ Side panel pick + size slider |
| Full-scene orbit / zoom / pan | ✅ |
| Flower move / tilt / resize / delete | ✅ |
| Overlapping selection (click-cycling) | ✅ |
| Drag silhouette ghost | ✅ |
| Board + background colour | ✅ |
| Save PNG (current view) | ✅ |
| Save GLB (bouquet only) | ✅ |
| First-run tutorial + re-open from header | ✅ |
| Backend catalog API | ⚠️ Scaffolded; frontend uses local `catalog.ts` |
| Design persistence (save/load arrangements) | ❌ Backend has in-memory `POST /api/designs` but UI does not use it yet |
| Undo / redo | ❌ |
| Mobile / touch-optimised controls | ❌ Untested |
| Vase/wrap as GLB assets | ❌ Still procedural `LatheGeometry` / `CylinderGeometry` |

---

## 11. Known limitations & sensible next steps

- **Large GLB downloads** — first placement of a heavy scan can pause on Suspense. Mitigation: warm-load a “favourites” subset, or compress/draco meshes.
- **GLB export fidelity** — exported files contain baked transforms (tilt, scale, position) but not the original PBR setup from Sketchfab in all cases; always verify in Blender before client delivery.
- **Screenshot = current frame** — UI overlays outside the canvas (save panel, hints) are not in the PNG; selection wireframes are hidden at export time.
- **Single-user, no auth** — designs live only in browser memory until you implement the existing `/api/designs` endpoints in the UI.
- **Catalog duplication** — `backend/src/data/catalog.ts` mirrors the frontend; they can drift. Move to one API source when inventory grows.

---

## 12. Emotional timeline (the struggles in plain language)

If the technical sections above feel abstract, this is the same story as a diary:

1. **“It looks fake.”** → Pivoted from SVG to real 3D scans. *Lesson: domain experts spot fake florals instantly.*
2. **“Why is there a Rubik’s cube?”** → Learned that scan pipelines embed scale references. *Lesson: always open a new asset in the viewer before showing users.*
3. **“The wireframe disappears when I let go.”** → Spent time blaming React state; the bug was event bubbling on a background mesh. *Lesson: use framework hooks (`onPointerMissed`) instead of invisible catch-alls.*
4. **“The flower teleports to the edge.”** → The ground-plane raycast was mathematically correct and UX-wrong. *Lesson: “where the ray hits” ≠ “where the user thinks they grabbed.”*
5. **“Resize works until I tilt the flower.”** → 2D math in a 3D world. *Lesson: always use the full 3D vector from anchor to handle.*
6. **“I can’t select the flower behind.”** → Raycasting returns the front hit only unless you ask for all hits. *Lesson: `intersections` is a feature, not noise.*
7. **“Everything goes blurry when I zoom out.”** → One line of fog config. *Lesson: atmospheric effects need explicit product approval.*
8. **“Save design does nothing / photo is blank.”** → WebGL buffer lifecycle + async React. *Lesson: screenshots and exports need explicit GL flags and sometimes synchronous scene tricks, not just state updates.*
9. **“Too many fake flowers in the list.”** → Cut procedural catalog entries. *Lesson: placeholders help dev, hurt trust in a “realistic” product.*

---

## 13. File map (quick reference)

```
Florist/
├── README.md                          ← run instructions + feature list
├── docs/PROJECT_JOURNAL.md            ← this file
├── 3d-flower-files/                   ← optional source archive for your GLBs
├── backend/src/server.ts              ← Express API (catalog + design stub)
└── frontend/
    ├── public/models/flowers/*.glb    ← runtime flower assets
    ├── scripts/inspect-glb.mjs        ← debug GLB node trees
    └── src/
        ├── components/App.tsx         ← all app state
        ├── components/TutorialOverlay.tsx
        ├── three/DesignBoard3D.tsx    ← scene + every interaction bug lived here
        └── three/Flower3D.tsx         ← load, clean, normalise GLBs
```

---

*Last updated: July 2026 — after drag ghost, click-to-add spiral, and tutorial shipped.*
