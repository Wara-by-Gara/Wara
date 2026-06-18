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
uniform float uAspect;
varying vec2 vUv;

#define PI 3.14159265

// Returns beam brightness at point p for a beam from origin at given angle.
// sharpGlow: wide soft glow, sharpCore: narrow bright center
float beam(vec2 p, vec2 origin, float angle, float sharpGlow, float sharpCore) {
  vec2 dir = vec2(cos(angle), sin(angle));
  vec2 toP = p - origin;
  float along = dot(toP, dir);
  float perp = dot(toP, vec2(-dir.y, dir.x));

  float glow = exp(-perp * perp * sharpGlow);
  float core = exp(-perp * perp * sharpCore);

  // fade in near origin, fade out with distance
  float nearFade = smoothstep(0.0, 0.06, along);
  float farFade  = exp(-along * 0.9);
  float frontMask = step(0.0, along);

  return (glow * 0.4 + core * 0.9) * nearFade * (0.25 + 0.75 * farFade) * frontMask;
}

void main() {
  vec2 uv = vUv;

  // aspect-corrected space: x in [-aspect/2, aspect/2], y in [0, 1]
  // origin = bottom center = (0.0, 0.0)
  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y);
  vec2 origin = vec2(0.0, 0.0);

  float t = uTime;
  float sg = 700.0;    // glow sharpness
  float sc = 55000.0;  // core sharpness

  // dark navy background
  vec3 col = vec3(0.02, 0.01, 0.09);

  // beam 1 — violet, swings left
  float a1 = (138.0 + 17.0 * sin(t * 0.34 + 0.0)) * PI / 180.0;
  col += vec3(0.55, 0.13, 1.0) * beam(p, origin, a1, sg, sc);

  // beam 2 — deep blue
  float a2 = (118.0 + 13.0 * sin(t * 0.51 + 1.1)) * PI / 180.0;
  col += vec3(0.18, 0.35, 1.0) * beam(p, origin, a2, sg, sc);

  // beam 3 — cyan, near center
  float a3 = (99.0 + 9.0 * sin(t * 0.67 + 2.2)) * PI / 180.0;
  col += vec3(0.0, 0.87, 1.0) * beam(p, origin, a3, sg, sc);

  // beam 4 — green
  float a4 = (81.0 + 11.0 * sin(t * 0.46 + 3.4)) * PI / 180.0;
  col += vec3(0.0, 1.0, 0.33) * beam(p, origin, a4, sg, sc);

  // beam 5 — teal
  float a5 = (64.0 + 13.0 * sin(t * 0.58 + 1.7)) * PI / 180.0;
  col += vec3(0.0, 1.0, 0.75) * beam(p, origin, a5, sg, sc);

  // beam 6 — purple, swings right
  float a6 = (48.0 + 17.0 * sin(t * 0.41 + 4.3)) * PI / 180.0;
  col += vec3(0.8, 0.2, 1.0) * beam(p, origin, a6, sg, sc);

  // origin glow — bright white-blue point
  float od = length(p - origin);
  col += vec3(0.65, 0.75, 1.0) * exp(-od * od * 35.0) * 2.0;

  // bottom ambient blue tint
  col += vec3(0.04, 0.04, 0.22) * exp(-uv.y * 5.0);

  // exposure tone map
  col = 1.0 - exp(-col * 1.3);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface LaserShowBackgroundProps {
  className?: string;
}

export function LaserShowBackground({ className }: LaserShowBackgroundProps) {
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
      uTime:   { value: 0 },
      uAspect: { value: container.clientWidth / container.clientHeight },
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
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
      uniforms.uAspect.value = container.clientWidth / container.clientHeight;
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
