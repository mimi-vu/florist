# Florist Studio

An interactive digital florist workshop. Compose photorealistic bouquets in 3D, save them as photos or exportable GLB models, and only cut real stems once the design is right.

## Why

Florists lose time and money on trial-and-error arrangements. Florist Studio lets you compose the whole piece digitally, orbit it in true 3D to check the silhouette from every angle, and only pick up the shears once you know the design works.

## Stack

**Frontend**
- React 18 + TypeScript + Vite 5
- Three.js via [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) (v8) + [@react-three/drei](https://drei.docs.pmnd.rs/) (v9)
- [`three-stdlib`](https://github.com/pmndrs/three-stdlib) for `GLTFExporter` and `OrbitControls` types
- User-provided `.glb` flower scans from Sketchfab (CC0 / CC-BY licensed) at `frontend/public/models/flowers/`
- Procedural Three.js geometry for vases (`LatheGeometry`) and wraps (`CylinderGeometry`)

**Backend**
- Node.js + Express 4 + TypeScript (`tsx watch` for dev)
- Currently exposes a catalog API — the frontend is fully client-side today, and the backend is scaffolded for future persistence

## Run it

```bash
# Terminal 1 — backend (optional today; catalog lives client-side)
cd backend
npm install
npm run dev            # http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev            # http://localhost:5173
```

## Features

- **Palette** — searchable list of 18 real 3D scans. Drag a card onto the board for pixel-precise placement, or click to drop it near the centre in a golden-angle spiral that never stacks stems on top of each other.
- **3D board** — full 360° orbit (including from directly above or below), scroll to zoom, right-drag to pan.
- **Live silhouette while dragging** — the flower's ghost previews the drop location in the scene, tinted to match the source flower.
- **Editing** — click a stem to select it. Drag its body to move (and lift/lower when viewed side-on), drag the corner handles to resize 1:1 with the cursor, drag the gold sphere at the top to tilt at any angle. Click a selected flower again to cycle through overlapping stems.
- **Vessels** — pick a vase, a wrap, both are mutually exclusive, or neither. A size slider on the right panel scales the active vessel; vessels are never edited on the board itself.
- **Stage customisation** — recolour the board disc and background from the top toolbar.
- **Saving** — the bottom-left of the stage has two buttons:
  - **Photo** downloads the current WebGL frame as a PNG.
  - **3D model** downloads only the bouquet (flowers + vessel) as a `.glb` you can open in Blender, Meshlab, Sketchfab, etc.
- **Tutorial** — a 5-step first-run walkthrough with dots, arrows, keyboard nav, and a Skip button. Re-openable any time from the Tutorial button in the header.

## Project layout

```
Florist/
├── 3d-flower-files/                 # source .glb drops from the user
├── backend/
│   └── src/
│       ├── server.ts                # Express bootstrap
│       ├── routes/                  # catalog endpoints
│       └── data/                    # in-memory catalog
├── docs/
│   └── PROJECT_JOURNAL.md           # what worked, what didn't, what we learned
└── frontend/
    ├── public/
    │   └── models/flowers/*.glb     # runtime-served flower assets
    ├── scripts/
    │   └── inspect-glb.mjs          # dumps the node graph inside a .glb
    └── src/
        ├── components/
        │   ├── App.tsx              # global state (placed stems, vessel, colours, tutorial)
        │   ├── Header.tsx
        │   ├── FlowerPalette.tsx    # left column, drag + click-to-add
        │   ├── VesselPanel.tsx      # right column, vase/wrap tabs + size slider
        │   └── TutorialOverlay.tsx  # onboarding walkthrough
        ├── data/catalog.ts          # FLOWERS, VASES, WRAPS + Credits
        ├── graphics/                # 2D SVG icons for the palette / vessel cards
        ├── styles/app.css
        ├── three/
        │   ├── DesignBoard3D.tsx    # the main scene + interaction layer
        │   ├── Flower3D.tsx         # loads a .glb, strips reference cubes, normalises to ground
        │   ├── Vase3D.tsx
        │   └── Wrap3D.tsx
        └── types/index.ts
```

## Documentation

| Doc | Contents |
| --- | --- |
| [`docs/PROJECT_JOURNAL.md`](docs/PROJECT_JOURNAL.md) | **Start here for the full story** — product evolution, architecture, every bug and fix, what you learned, asset workflow, limitations, and a “where to look when X breaks” index |
| This README | Setup, stack, feature list, folder layout |
