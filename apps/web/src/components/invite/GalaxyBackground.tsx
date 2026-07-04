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

// 해시 함수
float hash(vec2 p) {
  p = fract(p * vec2(234.5, 678.9));
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

// 2D 노이즈
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

// FBM — 성운 스트림 형태
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.12;

  // 성운 FBM 레이어
  vec2 q = vec2(fbm(uv * 2.5 + t), fbm(uv * 2.5 + vec2(1.7, 9.2) + t * 0.9));
  vec2 r = vec2(
    fbm(uv * 3.0 + 4.0 * q + vec2(1.7, 9.2) + t * 0.5),
    fbm(uv * 3.0 + 4.0 * q + vec2(8.3, 2.8) + t * 0.4)
  );
  float f = fbm(uv * 2.8 + 4.0 * r + t * 0.3);

  // 베이스 색상: 심우주 남보라
  vec3 base = vec3(0.04, 0.02, 0.10);

  // 성운 스트림 색상
  vec3 nebula1 = vec3(0.38, 0.10, 0.72); // 딥 퍼플
  vec3 nebula2 = vec3(0.62, 0.28, 0.90); // 라벤더
  vec3 nebula3 = vec3(0.85, 0.82, 0.98); // 흰빛 코어

  // f 값에 따라 색 혼합
  vec3 col = mix(base, nebula1, smoothstep(0.2, 0.5, f));
  col = mix(col, nebula2, smoothstep(0.45, 0.65, f));
  col = mix(col, nebula3, smoothstep(0.62, 0.75, f) * 0.6);

  // 밝기 부스트 (스트림 코어)
  col += nebula3 * smoothstep(0.68, 0.78, f) * 0.35;

  gl_FragColor = vec4(col, 1.0);
}
`;

interface GalaxyBackgroundProps {
  className?: string;
}

export function GalaxyBackground({ className }: GalaxyBackgroundProps) {
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

    const uniforms = {
      uTime: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    const ro = new ResizeObserver(handleResize);
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
