import { useMemo } from 'react';
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

interface Props {
  flowerId: FlowerId;
  selected?: boolean;
}

export function Flower3D({ flowerId }: Props) {
  const meta = FLOWERS.find((f) => f.id === flowerId)!;
  const url = urlFor(meta);
  if (url) return <FlowerFromGLTF url={url} nodeName={meta.modelNode} />;
  return <ProceduralFlower tint={meta.tint} />;
}

/* ------------------------------------------------------------------
   Loads a GLB, optionally extracts one named subtree (when several
   flowers share a single GLB), strips ffishAsia reference cubes,
   normalizes scale + origin, and enables shadows.
   ------------------------------------------------------------------ */

function FlowerFromGLTF({ url, nodeName }: { url: string; nodeName?: string }) {
  const { scene } = useGLTF(url) as unknown as { scene: THREE.Group };

  // Extract the requested subtree (or use the full scene), then clone so
  // multiple placed instances stay independent. Cube-strip + normalize
  // run BEFORE we hand it to the renderer.
  const cloned = useMemo(() => {
    const source = nodeName ? findNodeByName(scene, nodeName) : scene;
    if (!source) {
      console.warn(
        `[Flower3D] Node "${nodeName}" not found in ${url}. Falling back to whole scene.`
      );
      return prepare(scene.clone(true));
    }
    return prepare(source.clone(true));
  }, [scene, nodeName, url]);

  return (
    <group>
      <primitive object={cloned} />
    </group>
  );
}

function prepare(root: THREE.Object3D): THREE.Object3D {
  stripReferenceCubes(root);
  normalizeToGround(root, TARGET_HEIGHT);
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      (obj as THREE.Mesh).castShadow = true;
      (obj as THREE.Mesh).receiveShadow = true;
      const mat = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat && 'envMapIntensity' in mat) mat.envMapIntensity = 0.8;
    }
  });
  return root;
}

function findNodeByName(root: THREE.Object3D, name: string): THREE.Object3D | null {
  let found: THREE.Object3D | null = null;
  root.traverse((o) => {
    if (!found && o.name === name) found = o;
  });
  return found;
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

function normalizeToGround(root: THREE.Object3D, targetHeight: number) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  if (size.y > 0) root.scale.setScalar(targetHeight / size.y);
  const scaled = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  scaled.getCenter(center);
  root.position.set(-center.x, -scaled.min.y, -center.z);
}

/* ------------------------------------------------------------------
   Procedural stand-in for flowers without a GLB
   ------------------------------------------------------------------ */

function ProceduralFlower({ tint }: { tint: string }) {
  return (
    <group>
      <mesh castShadow position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.035, 0.05, 2.4, 8]} />
        <meshStandardMaterial color="#3f7f3a" roughness={0.75} />
      </mesh>
      <mesh castShadow position={[-0.25, 0.9, 0]} rotation={[0, 0, Math.PI / 4]}>
        <sphereGeometry args={[0.2, 12, 8]} />
        <meshStandardMaterial color="#4a8f45" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.28, 1.1, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial color="#4a8f45" roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 2.55, 0]}>
        <sphereGeometry args={[0.42, 24, 20]} />
        <meshStandardMaterial color={tint} roughness={0.55} metalness={0.02} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * Math.PI * 2) / 6;
        return (
          <mesh
            key={i}
            castShadow
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
