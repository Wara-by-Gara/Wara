'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/cn';

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 hsl2rgb(float h, float s, float l) {
  vec3 c = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
  return l + s * (c - 0.5) * (1.0 - abs(2.0 * l - 1.0));
}

void main() {
  vec2 uv = vUv;

  // 흰 베이스
  vec3 base = vec3(0.97, 0.97, 0.99);

  // 얇은막 간섭 (thin-film iridescence) — 위치+시간 기반 hue
  float hue = sin(uv.x * 2.5 + uTime * 0.25)
            + sin(uv.y * 3.0  + uTime * 0.18)
            + sin((uv.x + uv.y) * 4.0 + uTime * 0.12) * 0.5;
  vec3 rainbow = hsl2rgb(fract(hue * 0.18), 0.70, 0.80);

  // 대각선 광택 sweep — 포일이 빛을 받는 느낌
  float sweep = pow(max(0.0, sin((uv.x - uv.y) * 5.0 + uTime * 1.0)), 5.0);
  vec3 sweepColor = hsl2rgb(fract(uTime * 0.07 + 0.55), 0.55, 0.93);

  // 역방향 sweep (교차하는 빛)
  float sweep2 = pow(max(0.0, sin((uv.x + uv.y) * 4.0 - uTime * 0.7)), 6.0);
  vec3 sweepColor2 = hsl2rgb(fract(uTime * 0.05 + 0.1), 0.50, 0.92);

  // 반짝이 sparkle — 셀마다 독립 twinkle, tiny circular dot
  float sparkle = 0.0;
  for (int i = 0; i < 2; i++) {
    float scale = i == 0 ? 28.0 : 18.0;
    float seed  = i == 0 ? 0.0  : 5.3;
    vec2 cellId = floor(uv * scale);
    vec2 cellUv = fract(uv * scale);
    // 셀마다 다른 위치에 점 배치
    vec2 dotPos = vec2(
      hash(cellId + vec2(seed, 1.1)) * 0.6 + 0.2,
      hash(cellId + vec2(seed + 3.7, 2.9)) * 0.6 + 0.2
    );
    float d = length(cellUv - dotPos);
    // 셀마다 다른 속도로 twinkle
    float speed = 1.5 + hash(cellId + seed) * 3.5;
    float phase = hash(cellId + vec2(seed + 9.1, 0.0)) * 6.28;
    float twinkle = pow(max(0.0, sin(uTime * speed + phase)), 4.0);
    // ~15% 셀에만 존재
    float exists = step(0.85, hash(cellId + vec2(seed + 1.0, 3.0)));
    sparkle += smoothstep(0.07, 0.01, d) * twinkle * exists;
  }
  sparkle = clamp(sparkle, 0.0, 1.0);

  // 합성 — 흰색 유지하면서 무지개 얹기
  vec3 color = mix(base, rainbow, 0.30);
  color += sweepColor  * sweep  * 0.20;
  color += sweepColor2 * sweep2 * 0.15;
  color = clamp(color + sparkle * 0.55, 0.0, 1.0);

  gl_FragColor = vec4(color, 1.0);
}
`;

interface HologramBackgroundProps {
  className?: string;
}

export function HologramBackground({ className }: HologramBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = { uTime: { value: 0 } };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      if (!container) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
