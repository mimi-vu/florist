import { useMemo } from 'react';
import * as THREE from 'three';
import type { WrapId } from '../types';
import { WRAPS } from '../data/catalog';

/**
 * A wrap is an open, truncated cone — narrow at the base, fanning wide
 * at the top. We generate two cones (an outer and slightly smaller inner
 * fold) plus a twine ring at the base for the tie.
 */

interface Props {
  id: WrapId;
}

export function Wrap3D({ id }: Props) {
  const meta = WRAPS.find((w) => w.id === id)!;

  const outer = useMemo(() => new THREE.CylinderGeometry(2.4, 0.5, 3.2, 32, 4, true), []);
  const inner = useMemo(() => new THREE.CylinderGeometry(2.15, 0.42, 3.0, 32, 4, true), []);

  const isCellophane = id === 'wrap-cellophane';
  const isGold = id === 'wrap-gold';

  return (
    <group position={[0, 0, 0]}>
      {/* Outer cone */}
      <mesh geometry={outer} position={[0, 1.6, 0]} castShadow receiveShadow>
        {isCellophane ? (
          <meshPhysicalMaterial
            color={meta.tint}
            transparent
            transmission={0.8}
            thickness={0.1}
            roughness={0.15}
            side={THREE.DoubleSide}
            ior={1.35}
          />
        ) : (
          <meshStandardMaterial
            color={meta.tint}
            roughness={isGold ? 0.35 : 0.85}
            metalness={isGold ? 0.75 : 0.02}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>
      {/* Inner fold — same material, slightly darker shading via offset */}
      <mesh geometry={inner} position={[0, 1.55, 0]}>
        <meshStandardMaterial
          color={meta.tint}
          roughness={0.9}
          metalness={0.02}
          side={THREE.DoubleSide}
          transparent
          opacity={isCellophane ? 0.35 : 0.75}
        />
      </mesh>
      {/* Twine tie at base */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <torusGeometry args={[0.55, 0.05, 12, 32]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
      </mesh>
    </group>
  );
}
