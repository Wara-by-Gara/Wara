'use client';

import Cropper from 'react-easy-crop';
import { useState, useRef, useCallback } from 'react';
import type { Area } from 'react-easy-crop';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { Button } from '@/components/primitives/Button';

interface Props {
  imageSrc: string;
  isConfirming?: boolean;
  onBack: () => void;
  onConfirm: (croppedAreaPixels: Area) => void;
}

export function ProfileImageCropScreen({ imageSrc, isConfirming = false, onBack, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  const handleCropAreaChange = useCallback((_: Area, croppedAreaPixels: Area) => {
    croppedAreaPixelsRef.current = croppedAreaPixels;
  }, []);

  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-md flex-col bg-black text-white">
      <TopAppBar className="shrink-0" title="이미지 자르기" onBack={onBack} variant="transparent" />
      <main className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropAreaChange}
        />
      </main>
      <footer className="shrink-0 px-page py-5">
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="mb-4 w-full accent-white"
        />
        <Button
          variant="primary"
          fullWidth
          loading={isConfirming}
          onClick={() => {
            if (croppedAreaPixelsRef.current) {
              onConfirm(croppedAreaPixelsRef.current);
            }
          }}
        >
          맞췄어요
        </Button>
      </footer>
    </div>
  );
}
