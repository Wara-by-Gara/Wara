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
  p = fract(p * vec2(234.5, 678.9));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.1 + vec2(3.1, 7.4);
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.5;

  // 방향성 파도 — 여러 각도로 중첩
  float w1 = sin(uv.x * 7.0 + uv.y * 2.5 + t * 1.3);
  float w2 = sin(uv.x * 3.5 - uv.y * 5.0 + t * 0.9);
  float w3 = sin(uv.x * 11.0 + uv.y * 1.8 - t * 1.7) * 0.5;
  float w4 = sin(uv.y * 6.0 + uv.x * 3.0 + t * 0.7) * 0.6;
  float waves = (w1 + w2 + w3 + w4) * 0.25 + 0.5; // 0~1 범위

  // FBM 난류 — 표면 잔물결 질감
  vec2 flow = vec2(t * 0.04, t * 0.02);
  float turb = fbm(uv * 3.0 + flow + waves * 0.4);

  // 표면 합산
  float surface = waves * 0.55 + turb * 0.45;

  // 파도 마루 거품 — sharp crest highlight
  float crest = pow(max(0.0, sin(surface * 15.7)), 5.0);

  // 코스틱 반짝임 — 물 속 빛 굴절
  float caustic = abs(sin(turb * 9.42));
  caustic = pow(caustic, 3.5) * 0.4;

  // 바다 팔레트 — 열대/지중해 바다
  vec3 seaDeep = vec3(0.35, 0.78, 0.88);  // #59c7e0 — 연한 바다색
  vec3 seaMid  = vec3(0.50, 0.88, 0.94);  // #80e0f0 — 연한 중간 바다
  vec3 seaSurf = vec3(0.30, 0.86, 0.90);  // #4cdbE6 — 밝은 터콰이즈
  vec3 seaFoam = vec3(0.88, 0.98, 1.00);  // #e0fafe — 파도 거품

  // 깊이 기반 색 혼합
  vec3 col = mix(seaDeep, seaMid, smoothstep(0.25, 0.55, surface));
  col = mix(col, seaSurf, smoothstep(0.52, 0.78, surface));

  // 코스틱 + 거품 오버레이
  col = mix(col, seaFoam, caustic);
  col = mix(col, seaFoam, crest * 0.75);

  // 태양빛 반사 (좌상단)
  float sunGlow = smoothstep(0.85, 0.0, length(uv - vec2(0.2, 0.3)));
  col = mix(col, seaFoam, sunGlow * 0.25);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface WaterBackgroundProps {
  className?: string;
}

export function WaterBackground({ className }: WaterBackgroundProps) {
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
