"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DEFAULT_INK = "#0E0B08";

function buildPawGeometry(): THREE.ShapeGeometry {
  const shapes: THREE.Shape[] = [];

  const pad = new THREE.Shape();
  pad.absarc(0, 0, 1.4, 0, Math.PI * 2, false);
  shapes.push(pad);

  const toes: Array<[number, number, number]> = [
    [-1.9, 1.6, 0.7],
    [-0.7, 2.5, 0.7],
    [0.7, 2.5, 0.7],
    [1.9, 1.6, 0.7],
  ];
  toes.forEach(([x, y, r]) => {
    const s = new THREE.Shape();
    s.absarc(x, y, r, 0, Math.PI * 2, false);
    shapes.push(s);
  });

  return new THREE.ShapeGeometry(shapes);
}

/**
 * 결정론적 의사난수 [0, 1) — (i, cycleN, salt)에 안정적인 값.
 * sin-hash 방식: 단순 LCG보다 분포가 흩어져 "가상선" 패턴이 안 생김.
 */
function pseudoRand(i: number, cycleN: number, salt: number): number {
  const x =
    Math.sin(i * 12.9898 + cycleN * 78.233 + salt * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

function Footprints({
  color,
  speed,
  count,
}: {
  color: string;
  speed: number;
  count: number;
}) {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => buildPawGeometry(), []);
  // 각 발자국 별도 material — useFrame에서 opacity 개별 조정
  const materials = useMemo(
    () =>
      Array.from(
        { length: count },
        () =>
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0,
          }),
      ),
    [count, color],
  );
  // 각 발자국 별 cycle 길이·offset (다양한 박자로 분산)
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        cycleDuration: (4 + ((i * 0.73) % 4)) / Math.max(speed, 0.1),
        cycleOffset: (i * 1.31) % 4,
      })),
    [count, speed],
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    // 실제 화면 비율 단위로 발자국 분포 → 모바일·데스크톱 모두 화면 가득 분포
    const { width: vw, height: vh } = state.viewport;
    const halfW = (vw / 2) * 0.95;
    const halfH = (vh / 2) * 0.95;
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i];
      const item = items[i];
      if (!child || !item) continue;

      const phase = (t + item.cycleOffset) / item.cycleDuration;
      const cycleN = Math.floor(phase);
      const localT = phase - cycleN;

      // cycle 마다 새 위치·회전 (의사난수로 흩어짐, 화면 단위 비례)
      child.position.x = (pseudoRand(i, cycleN, 1) * 2 - 1) * halfW;
      child.position.y = (pseudoRand(i, cycleN, 2) * 2 - 1) * halfH;
      child.rotation.z = pseudoRand(i, cycleN, 3) * Math.PI * 2;

      // opacity 페이드 사이클 (15% 페이드 인 → 50% 머무름 → 25% 페이드 아웃 → 10% 안 보임)
      let opacity = 0;
      if (localT < 0.05) {
        opacity = 0;
      } else if (localT < 0.2) {
        opacity = ((localT - 0.05) / 0.15) * 0.65;
      } else if (localT < 0.7) {
        opacity = 0.65;
      } else if (localT < 0.95) {
        opacity = (1 - (localT - 0.7) / 0.25) * 0.65;
      }
      const mat = materials[i];
      if (mat) mat.opacity = opacity;
    }
  });

  return (
    <group ref={group}>
      {items.map((_, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={materials[i]!}
          scale={0.45}
        />
      ))}
    </group>
  );
}

export interface ThreeCatSceneProps {
  inkColor?: string;
  count?: number;
  speed?: number;
}

export function ThreeCatScene({
  inkColor = DEFAULT_INK,
  count = 12,
  speed = 1,
}: ThreeCatSceneProps) {
  const safeCount = Math.min(count, 28);

  return (
    <Canvas
      orthographic
      camera={{ zoom: 22, position: [0, 0, 10] }}
      style={{ width: "100%", height: "100%" }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
    >
      <Footprints color={inkColor} speed={speed * 1.4} count={safeCount} />
    </Canvas>
  );
}
