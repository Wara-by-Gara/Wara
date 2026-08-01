'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/cn';

// 구름 높이를 화면 높이 비율로 정의 (0~1)
// worldH = heightFraction * 2 (카메라 Y범위 -1~1 = 2 world units)
// worldW = worldH * imageAspect (정방형 world unit → 보정 불필요)
// OrthographicCamera(-aspect, aspect, 1, -1) 사용 → 1 world unit = 동일 픽셀 (X=Y)
const CLOUD_CONFIGS = [
  { src: '/clouds/cloud-1.png', heightFraction: 0.16 },
  { src: '/clouds/cloud-2.png', heightFraction: 0.11 },
  { src: '/clouds/cloud-3.png', heightFraction: 0.15 },
  { src: '/clouds/cloud-4.png', heightFraction: 0.14 },
  { src: '/clouds/cloud-5.png', heightFraction: 0.15 },
  { src: '/clouds/cloud-6.png', heightFraction: 0.13 },
  { src: '/clouds/cloud-7.png', heightFraction: 0.18 },
  { src: '/clouds/cloud-2.png', heightFraction: 0.12 },
  { src: '/clouds/cloud-5.png', heightFraction: 0.13 },
  { src: '/clouds/cloud-7.png', heightFraction: 0.16 },
] as const;

const INSTANCES_PER_TYPE = 1;

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uTexture;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec4 col = texture2D(uTexture, vUv);
  float brightness = col.r;
  float rawAlpha = smoothstep(0.01, 0.55, brightness);
  float alpha = pow(rawAlpha, 0.55) * uOpacity;
  vec3 result = pow(col.rgb, vec3(0.35));
  result = mix(vec3(1.0), result, 0.1 + brightness * 0.9);
  gl_FragColor = vec4(result, alpha);
}
`;

interface CloudInstance {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  speed: number;
  halfW: number;
}

interface Props {
  className?: string;
  startIdx?: number;
  endIdx?: number;
}

export function CloudSpriteAnimation({ className, startIdx = 0, endIdx }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let destroyed = false;

    const getSize = () => {
      const r = container.getBoundingClientRect();
      const w = r.width || container.clientWidth || 375;
      const h = r.height || container.clientHeight || 667;
      return { w, h, aspect: w / h };
    };

    const { w, h, aspect: initAspect } = getSize();

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // 정방형 world unit: left/right = ±aspect, top/bottom = ±1
    // → 1 world unit이 X축·Y축 모두 동일한 픽셀 수
    const camera = new THREE.OrthographicCamera(-initAspect, initAspect, 1, -1, 0.1, 10);
    camera.position.z = 1;

    // 리사이즈 시 camera.right 추적
    let currentAspect = initAspect;

    const textureLoader = new THREE.TextureLoader();
    const clouds: CloudInstance[] = [];
    const textures: THREE.Texture[] = [];
    let frameId: number;
    let clock: THREE.Clock;

    const configs = CLOUD_CONFIGS.slice(startIdx, endIdx ?? CLOUD_CONFIGS.length);
    const loadPromises = configs.map(
      ({ src, heightFraction }: { src: string; heightFraction: number }) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            if (destroyed) return resolve();

            const imageAspect = img.naturalWidth / img.naturalHeight;
            const texture = textureLoader.load(src);
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            textures.push(texture);

            for (let inst = 0; inst < INSTANCES_PER_TYPE; inst++) {
              const mobileFactor = w <= 480 ? 0.4 : 1.0;
              const scaleFactor = 1.0;
              // worldH: 화면 높이의 heightFraction (정방형 unit이므로 보정 불필요)
              const worldH = heightFraction * 2 * scaleFactor * mobileFactor;
              // worldW: 이미지 실제 비율 그대로 적용
              const worldW = worldH * imageAspect;
              const halfW = worldW / 2;

              const geometry = new THREE.PlaneGeometry(worldW, worldH);
              const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                  uTexture: { value: texture },
                  uOpacity: { value: 0.92 + Math.random() * 0.08 },
                },
                transparent: true,
                depthWrite: false,
              });

              // 초기 위치: 왼쪽 밖에서 순차 진입 (구름마다 다른 거리 → 다른 타이밍에 화면 진입)
              // startIdx를 더해야 함 — 안 더하면 startIdx로 나뉜 두 레이어가 똑같이 0부터 스태거링을 시작해서
              // 서로 다른 레이어의 구름이 같은 타이밍에 겹쳐 진입함
              const totalClouds = CLOUD_CONFIGS.length * INSTANCES_PER_TYPE;
              const segmentIdx = startIdx + clouds.length;
              const startX = -initAspect - halfW - (segmentIdx / totalClouds) * initAspect * 3 - Math.random() * 0.3;
              const startY = (Math.random() * 2.0) - 1.0;

              const mesh = new THREE.Mesh(geometry, material);
              mesh.position.set(startX, startY, 0);
              scene.add(mesh);

              clouds.push({ mesh, speed: 0.06 + Math.random() * 0.045, halfW });
            }
            resolve();
          };
          img.onerror = () => resolve();
          img.src = src;
        }),
    );

    Promise.all(loadPromises).then(() => {
      if (destroyed) return;

      clock = new THREE.Clock();

      const animate = () => {
        frameId = requestAnimationFrame(animate);
        const delta = clock.getDelta();

        for (const cloud of clouds) {
          cloud.mesh.position.x += cloud.speed * delta;
          // 리셋 기준: 현재 camera.right (리사이즈 반영)
          if (cloud.mesh.position.x - cloud.halfW > currentAspect) {
            cloud.mesh.position.x = -currentAspect - cloud.halfW - Math.random() * 0.5;
            cloud.mesh.position.y = (Math.random() * 2.0) - 1.0;
          }
        }

        renderer.render(scene, camera);
      };
      animate();
    });

    const ro = new ResizeObserver(() => {
      if (!container) return;
      const { w: nw, h: nh, aspect: na } = getSize();
      currentAspect = na;
      renderer.setSize(nw, nh);
      // 카메라 left/right만 업데이트 — 구름 geometry 재생성 불필요
      camera.left = -na;
      camera.right = na;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    return () => {
      destroyed = true;
      cancelAnimationFrame(frameId);
      ro.disconnect();
      clouds.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
    />
  );
}
