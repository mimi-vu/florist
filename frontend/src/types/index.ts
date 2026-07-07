export type FlowerId =
  | 'spider-lily-white'
  | 'spider-lily-gold'
  | 'spider-lily-red'
  | 'rain-lily-pink'
  | 'statice-purple'
  | 'wisteria'
  | 'sorrel'
  | 'chrysanthemum'
  | 'cottonweed'
  | 'raspberry'
  | 'hydrangea-lace'
  | 'buttercup-japanese'
  | 'buttercup-spinyfruit'
  | 'ivy-glechoma'
  | 'skullcap-japanese'
  | 'skunkvine'
  | 'wild-bloom'
  | 'rose-red';

export type VaseId =
  | 'vase-glass-cyl'
  | 'vase-crystal'
  | 'vase-ceramic-white'
  | 'vase-terracotta'
  | 'vase-brass'
  | 'vase-black-matte'
  | 'vase-mason'
  | 'vase-bud-trio'
  | 'vase-porcelain-blue'
  | 'vase-fluted';

export type WrapId =
  | 'wrap-kraft'
  | 'wrap-white'
  | 'wrap-black'
  | 'wrap-blush'
  | 'wrap-sage'
  | 'wrap-lace'
  | 'wrap-burlap'
  | 'wrap-cellophane'
  | 'wrap-newsprint'
  | 'wrap-navy'
  | 'wrap-terracotta'
  | 'wrap-gold';

export interface FlowerMeta {
  id: FlowerId;
  name: string;
  latin: string;
  seasonal: string;
  hasModel: boolean;
  tint: string;
  /** Structured credit — grouped in the palette footer. */
  credit?: Credit;
  /**
   * Optional explicit URL of the .glb. Defaults to `/models/flowers/{id}.glb`.
   * Use this to point multiple flower entries at the same GLB file
   * (see `modelNode` below).
   */
  modelUrl?: string;
  /**
   * Optional node name inside the GLB to extract as this flower. If a
   * scan contains several plants in one file (e.g. `Rose_Red`, `Rose_Pink`,
   * `Rose_White` under the scene root), register one FlowerMeta per node
   * and set `modelUrl` to the shared file and `modelNode` to the node name.
   * If omitted, the whole scene is used.
   */
  modelNode?: string;
}

export interface Credit {
  license: 'CC0-1.0' | 'CC-BY-4.0';
  author: string;
  authorUrl?: string;
}

export interface VaseMeta {
  id: VaseId;
  name: string;
  material: string;
  tint: string;
  glass?: boolean;
}

export interface WrapMeta {
  id: WrapId;
  name: string;
  material: string;
  tint: string;
}

export interface PlacedFlower {
  uid: string;
  flowerId: FlowerId;
  position: [number, number, number]; // world x, y (height), z
  rotationY: number;   // yaw — spin around vertical
  tiltX: number;       // pitch — lean forward / back
  tiltZ: number;       // roll  — lean left / right
  scale: number;
  z: number;
}

export type Vessel =
  | { kind: 'vase'; id: VaseId; scale: number }
  | { kind: 'wrap'; id: WrapId; scale: number }
  | { kind: 'none' };

export type Selection =
  | { kind: 'flower'; uid: string }
  | null;
