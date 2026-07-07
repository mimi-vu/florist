import { useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import type { FlowerId, FlowerMeta } from '../types';
import { FLOWERS } from '../data/catalog';

/**
 * Resolve the .glb URL for a given flower:
 *   1. explicit `meta.modelUrl` (shared across flowers that live in one GLB)
 *   2. otherwise the convention `/models/flowers/{id}.glb`
 * Only returns a URL when `hasModel` is true.
 */
function urlFor(meta: FlowerMeta): string | null {
  if (!meta.hasModel) return null;
  return meta.modelUrl ?? `/models/flowers/${meta.id}.glb`;
}

// With ~18 real-3D flowers totalling ~600 MB of GLB data, we deliberately
// avoid preloading anything on module load — that would kick off a huge
// download the moment the app starts. Instead each Flower3D suspends and
// fetches its .glb the first time it's mounted, then drei caches it so
// every subsequent placement is instant. The Suspense boundary shows a
// simple stem placeholder while a new model streams in.

const TARGET_HEIGHT = 3; // world units — keeps every flower comparable in scale

/** Axis-aligned bounds after normalization — used to fit the selection box. */
export interface FlowerBounds {
  width: number;
  height: number;
  depth: number;
}

export const DEFAULT_FLOWER_BOUNDS: FlowerBounds = {
  width: 1.4,
  height: TARGET_HEIGHT,
  depth: 1.4,
};

interface Props {
  flowerId: FlowerId;
  selected?: boolean;
  /** When false, meshes ignore the raycaster so orbit works through them. */
  interactive?: boolean;
  /** Called once the model is prepared with its local-axis bounds. */
  onBoundsChange?: (bounds: FlowerBounds) => void;
}

export function Flower3D({ flowerId, interactive = true, onBoundsChange }: Props) {
  const meta = FLOWERS.find((f) => f.id === flowerId)!;
  const url = urlFor(meta);
  if (url) {
    return (
      <FlowerFromGLTF
        url={url}
        nodeName={meta.modelNode}
        nodeNames={meta.modelNodes}
        excludeNodes={meta.excludeNodes}
        excludeMaterials={meta.excludeMaterials}
        rotation={meta.modelRotation}
        interactive={interactive}
        onBoundsChange={onBoundsChange}
      />
    );
  }
  return (
    <ProceduralFlower
      tint={meta.tint}
      interactive={interactive}
      onBoundsChange={onBoundsChange}
    />
  );
}

/* ------------------------------------------------------------------
   Loads a GLB, optionally extracts one named subtree (when several
   flowers share a single GLB), strips ffishAsia reference cubes,
   normalizes scale + origin. Shadows off on flowers — each scan has
   many meshes and castShadow was the main GPU cost as bouquets grow.
   ------------------------------------------------------------------ */

function FlowerFromGLTF({
  url,
  nodeName,
  nodeNames,
  excludeNodes,
  excludeMaterials,
  rotation,
  interactive,
  onBoundsChange,
}: {
  url: string;
  nodeName?: string;
  nodeNames?: string[];
  excludeNodes?: string[];
  excludeMaterials?: string[];
  rotation?: [number, number, number];
  interactive: boolean;
  onBoundsChange?: (bounds: FlowerBounds) => void;
}) {
  const { scene } = useGLTF(url) as unknown as { scene: THREE.Group };

  const { cloned, offset, bounds } = useMemo(() => {
    const source = extractSource(scene, nodeName, nodeNames);
    if (nodeName && !nodeNames?.length && !findNodeByName(scene, nodeName)) {
      console.warn(
        `[Flower3D] Node "${nodeName}" not found in ${url}. Falling back to whole scene.`
      );
      return prepare(scene.clone(true), rotation, interactive, excludeNodes, excludeMaterials);
    }
    return prepare(source, rotation, interactive, excludeNodes, excludeMaterials);
  }, [scene, nodeName, nodeNames, excludeNodes, excludeMaterials, rotation, url, interactive]);

  useLayoutEffect(() => {
    onBoundsChange?.(bounds);
  }, [bounds, onBoundsChange]);

  return (
    <group position={offset}>
      <primitive object={cloned} />
    </group>
  );
}

function prepare(
  root: THREE.Object3D,
  rotation: [number, number, number] | undefined,
  interactive: boolean,
  excludeNodes?: string[],
  excludeMaterials?: string[]
): { cloned: THREE.Object3D; offset: [number, number, number]; bounds: FlowerBounds } {
  stripReferenceCubes(root);
  if (excludeNodes?.length) excludeNamedNodes(root, excludeNodes);
  if (excludeMaterials?.length) excludeMaterialsByName(root, excludeMaterials);
  if (rotation) root.rotation.set(...rotation);
  alignMaterialLayers(root);
  const { offset, bounds } = normalizeToGround(root, TARGET_HEIGHT);
  root.traverse((obj) => {
    if (!interactive) obj.raycast = () => null;
    if ((obj as THREE.Mesh).isMesh) {
      (obj as THREE.Mesh).castShadow = false;
      (obj as THREE.Mesh).receiveShadow = false;
      const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 0.8;
    }
  });
  return { cloned: root, offset, bounds };
}

function findNodeByName(root: THREE.Object3D, name: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (!found && o.name === name) found = o;
  });
  return found;
}

/** Pull one node, or merge several named subtrees into a fresh group. */
function extractSource(
  scene: THREE.Object3D,
  nodeName?: string,
  nodeNames?: string[]
): THREE.Object3D {
  if (nodeNames?.length) {
    const group = new THREE.Group();
    for (const name of nodeNames) {
      const node = findNodeByName(scene, name);
      if (node) group.add(node.clone(true));
    }
    return group;
  }
  if (nodeName) {
    const node = findNodeByName(scene, nodeName);
    return node ? node.clone(true) : scene.clone(true);
  }
  return scene.clone(true);
}

function excludeMaterialsByName(root: THREE.Object3D, names: string[]) {
  const doomed: THREE.Object3D[] = [];
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (materials.some((mat) => names.includes(mat.name))) doomed.push(obj);
  });
  for (const obj of doomed) obj.parent?.remove(obj);
}

/**
 * ffishAsia scans include a small coloured reference cube for scale.
 * Remove any node whose name matches the cube pattern (or any tiny
 * disconnected mesh that happens to be roughly cube-shaped).
 */
function stripReferenceCubes(root: THREE.Object3D) {
  const doomed: THREE.Object3D[] = [];
  root.traverse((obj) => {
    const name = obj.name || '';
    if (/^_?cube(_\d+)?$/i.test(name) || /reference/i.test(name)) {
      doomed.push(obj);
      return;
    }
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      mesh.geometry.computeBoundingBox();
      const bb = mesh.geometry.boundingBox;
      if (!bb) return;
      const size = new THREE.Vector3();
      bb.getSize(size);
      const [sx, sy, sz] = [size.x, size.y, size.z].sort((a, b) => a - b);
      const cubelike = sx > 0 && sz / sx < 1.25 && sy / sx < 1.25;
      const tiny = size.length() < 0.15;
      if (cubelike && tiny) doomed.push(obj);
    }
  });
  for (const obj of doomed) obj.parent?.remove(obj);
}

function excludeNamedNodes(root: THREE.Object3D, names: string[]) {
  const doomed: THREE.Object3D[] = [];
  root.traverse((obj) => {
    if (names.includes(obj.name)) doomed.push(obj);
  });
  for (const obj of doomed) obj.parent?.remove(obj);
}

/**
 * ffish scans often split one plant into two texture passes (tex0 + tex1, or
 * similarly named materials) exported with slightly different origins.
 * Only align overlapping passes within each subtree — never pull separate
 * physical parts (e.g. wisteria leaves) onto the flower textures.
 */
function alignMaterialLayers(root: THREE.Object3D) {
  const targets =
    root.children.length > 1
      ? root.children.filter((c) => c.children.length > 0 || (c as THREE.Mesh).isMesh)
      : [root];
  for (const target of targets) alignMaterialLayersInSubtree(target);
}

function materialStemRatio(meshes: THREE.Mesh[]): number {
  let below = 0;
  let total = 0;
  const pos = new THREE.Vector3();
  for (const mesh of meshes) {
    const geom = mesh.geometry;
    const posAttr = geom.getAttribute('position');
    if (!posAttr) continue;
    mesh.updateWorldMatrix(true, false);
    for (let i = 0; i < posAttr.count; i += 8) {
      pos.fromBufferAttribute(posAttr, i).applyMatrix4(mesh.matrixWorld);
      if (pos.y < 0) below++;
      total++;
    }
  }
  return total > 0 ? below / total : 0.5;
}

/** Stem + bloom passes (e.g. spider lilies): bloom wins depth so stems don't pierce petals. */
function configureStemBloomPasses(stemMeshes: THREE.Mesh[], bloomMeshes: THREE.Mesh[]) {
  for (const mesh of stemMeshes) {
    mesh.renderOrder = 0;
    const mat = mesh.material as THREE.Material;
    if (!mat.userData.stemBloomConfigured) {
      mesh.material = mat.clone();
      (mesh.material as THREE.Material).depthWrite = false;
      mesh.material.userData.stemBloomConfigured = true;
    }
  }
  for (const mesh of bloomMeshes) mesh.renderOrder = 1;
}

function alignMaterialLayersInSubtree(root: THREE.Object3D) {
  const groups = new Map<string, THREE.Mesh[]>();
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.material) return;
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    if (!mat) return;
    const key = mat.name || mat.uuid;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(mesh);
  });
  if (groups.size < 2) return;

  const boxes = new Map<string, THREE.Box3>();
  const centers = new Map<string, THREE.Vector3>();
  const stemRatios = new Map<string, number>();
  for (const [key, meshes] of groups) {
    const box = new THREE.Box3();
    for (const mesh of meshes) box.union(new THREE.Box3().setFromObject(mesh));
    boxes.set(key, box);
    centers.set(key, box.getCenter(new THREE.Vector3()));
    stemRatios.set(key, materialStemRatio(meshes));
  }

  const keys = [...groups.keys()];
  if (keys.length === 2) {
    const [a, b] = keys;
    const aStem = stemRatios.get(a)!;
    const bStem = stemRatios.get(b)!;
    const stemKey = aStem >= 0.55 && bStem <= 0.45 ? a : bStem >= 0.55 && aStem <= 0.45 ? b : null;
    if (stemKey) {
      const bloomKey = stemKey === a ? b : a;
      configureStemBloomPasses(groups.get(stemKey)!, groups.get(bloomKey)!);
      return;
    }
  }

  const primaryKey =
    keys.find((k) => /tex0|_tex0/i.test(k)) ??
    keys.find((k) => !/tex1|_tex1/i.test(k)) ??
    keys[0];
  const primaryBox = boxes.get(primaryKey)!;

  for (const [key, meshes] of groups) {
    if (key === primaryKey) continue;
    const box = boxes.get(key)!;
    if (!primaryBox.intersectsBox(box)) continue;
    const delta = centers.get(primaryKey)!.clone().sub(centers.get(key)!);
    if (delta.lengthSq() < 0.0001) continue;
    for (const mesh of meshes) mesh.position.add(delta);
  }
}

function normalizeToGround(
  root: THREE.Object3D,
  targetHeight: number
): { offset: [number, number, number]; bounds: FlowerBounds } {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.y > 0) root.scale.setScalar(targetHeight / size.y);
  const scaled = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  scaled.getCenter(center);
  const finalSize = new THREE.Vector3();
  scaled.getSize(finalSize);
  // Apply centering on a wrapper group — keep the cloned root at local origin
  // so selection wireframes share the same coordinate space as the mesh.
  const pad = 1.06;
  return {
    offset: [-center.x, -scaled.min.y, -center.z],
    bounds: {
      width: finalSize.x * pad,
      height: finalSize.y * pad,
      depth: finalSize.z * pad,
    },
  };
}

/* ------------------------------------------------------------------
   Procedural stand-in for flowers without a GLB
   ------------------------------------------------------------------ */

function ProceduralFlower({
  tint,
  interactive,
  onBoundsChange,
}: {
  tint: string;
  interactive: boolean;
  onBoundsChange?: (bounds: FlowerBounds) => void;
}) {
  const passthrough = interactive ? {} : { raycast: () => null };

  useLayoutEffect(() => {
    onBoundsChange?.(DEFAULT_FLOWER_BOUNDS);
  }, [onBoundsChange]);

  return (
    <group {...passthrough}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 2.4, 8]} />
        <meshStandardMaterial color="#3f7f3a" roughness={0.75} />
      </mesh>
      <mesh position={[-0.25, 0.9, 0]} rotation={[0, 0, Math.PI / 4]}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial color="#4a8f45" roughness={0.7} />
      </mesh>
      <mesh position={[0.28, 1.1, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial color="#4a8f45" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.42, 24, 20]} />
        <meshStandardMaterial color={tint} roughness={0.55} metalness={0.02} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * Math.PI * 2) / 6;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.32, 2.55, Math.sin(a) * 0.32]}
            rotation={[0, -a, 0]}
          >
            <sphereGeometry args={[0.22, 16, 12]} />
            <meshStandardMaterial color={tint} roughness={0.6} metalness={0.02} />
          </mesh>
        );
      })}
    </group>
  );
}
