'use client';

import Cropper from 'react-easy-crop';
import { useState, useCallback } from 'react';
import type { Point, Area } from 'react-easy-crop';

interface Props {
  imageSrc: string;
  /** width / height. 기본 1 (정사각형) */
  aspect?: number;
  onCropComplete: (croppedAreaPixels: Area) => void;
}

export default function ImageCropEditor({ imageSrc, aspect = 1, onCropComplete }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      onCropComplete(croppedAreaPixels);
    },
    [onCropComplete],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div className="flex items-center gap-3 px-1">
        <span className="text-xs text-gray-400 shrink-0">축소</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full accent-black"
          aria-label="확대/축소"
        />
        <span className="text-xs text-gray-400 shrink-0">확대</span>
      </div>
    </div>
  );
}
