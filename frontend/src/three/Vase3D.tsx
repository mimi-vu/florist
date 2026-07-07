import { useMemo } from 'react';
import * as THREE from 'three';
import type { VaseId } from '../types';
import { VASES } from '../data/catalog';

/**
 * Vases are rotationally symmetric, so we generate each one from a
 * silhouette lathed around the Y axis. Glass vases use physical
 * material with transmission for a real refractive look; opaque
 * ceramics/metals use standard material with tuned roughness.
 */

type Silhouette = [number, number][];

const SILHOUETTES: Record<VaseId, Silhouette> = {
  'vase-glass-cyl':      [[0.05, 0], [0.55, 0], [0.6, 0.05], [0.6, 1.5], [0.55, 1.55], [0.55, 1.6]],
  'vase-crystal':        [[0.05, 0], [0.6, 0.05], [0.5, 1.2], [0.6, 1.55], [0.55, 1.6]],
  'vase-ceramic-white':  [[0.05, 0], [0.4, 0.02], [0.65, 0.4], [0.55, 1.0], [0.45, 1.4], [0.5, 1.55], [0.45, 1.6]],
  'vase-terracotta':     [[0.05, 0], [0.45, 0.05], [0.55, 0.15], [0.55, 1.4], [0.65, 1.55], [0.6, 1.6]],
  'vase-brass':          [[0.05, 0], [0.35, 0.1], [0.55, 0.5], [0.5, 1.1], [0.4, 1.5], [0.45, 1.6]],
  'vase-black-matte':    [[0.05, 0], [0.55, 0.05], [0.55, 1.5], [0.5, 1.6]],
  'vase-mason':          [[0.05, 0], [0.5, 0.05], [0.5, 1.2], [0.42, 1.35], [0.42, 1.55], [0.4, 1.6]],
  'vase-bud-trio':       [[0.05, 0], [0.18, 0.05], [0.22, 0.7], [0.15, 1.4], [0.18, 1.6]],
  'vase-porcelain-blue': [[0.05, 0], [0.4, 0.05], [0.6, 0.5], [0.5, 1.1], [0.4, 1.4], [0.45, 1.55], [0.4, 1.6]],
  'vase-fluted':         [[0.05, 0], [0.5, 0.05], [0.55, 0.4], [0.5, 1.4], [0.55, 1.6]],
};

interface Props {
  id: VaseId;
}

export function Vase3D({ id }: Props) {
  const meta = VASES.find((v) => v.id === id)!;
  const geometry = useMemo(() => {
    const pts = SILHOUETTES[id].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 48);
  }, [id]);

  // Glass gets refractive physical material, everything else gets tuned standard.
  if (meta.glass) {
    return (
      <group>
        <mesh geometry={geometry}>
          <meshPhysicalMaterial
            color={meta.tint}
            transparent
            transmission={0.85}
            thickness={0.35}
            roughness={0.05}
            metalness={0}
            ior={1.45}
            clearcoat={0.4}
            clearcoatRoughness={0.05}
            envMapIntensity={1.4}
          />
        </mesh>
        {/* subtle rim so glass reads at any angle */}
        <mesh geometry={geometry}>
          <meshBasicMaterial color={meta.tint} wireframe transparent opacity={0.06} />
        </mesh>
      </group>
    );
  }

  const isMetal = id === 'vase-brass';
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={meta.tint}
        roughness={isMetal ? 0.35 : id === 'vase-black-matte' ? 0.95 : 0.55}
        metalness={isMetal ? 0.85 : 0.02}
      />
    </mesh>
  );
}
