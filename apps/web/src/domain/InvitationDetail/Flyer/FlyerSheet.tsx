"use client";

import { useEffect, useRef, useState } from "react";
import { BottomSheet, Button, toast } from "@wara/ui";
import type { Invitation } from "@/lib/api/invitations";

interface Props {
  invitation: Invitation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const W = 1080;
const H = 1350;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** 캔버스로 초대장 플라이어 이미지를 합성해 다운로드 (QR 없음) */
export function FlyerSheet({ invitation, open, onOpenChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  const dateText = invitation.eventStartAt
    ? new Date(invitation.eventStartAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "short",
      })
    : "날짜 미정";
  const locationText =
    invitation.eventLocation?.placeName ??
    invitation.eventLocation?.address ??
    "";

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setReady(false);

    const draw = (cover?: HTMLImageElement) => {
      // 배경 그라데이션
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#FDF2F8");
      grad.addColorStop(1, "#EDE9FE");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 커버 이미지 (있으면 상단 정사각)
      let textTop = 180;
      if (cover) {
        const size = 720;
        const x = (W - size) / 2;
        const y = 120;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 32);
        ctx.clip();
        // cover-fit
        const ratio = Math.max(size / cover.width, size / cover.height);
        const cw = cover.width * ratio;
        const chh = cover.height * ratio;
        ctx.drawImage(cover, x + (size - cw) / 2, y + (size - chh) / 2, cw, chh);
        ctx.restore();
        textTop = y + size + 80;
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "#1f1d29";
      ctx.font = "bold 72px Pretendard, sans-serif";
      const titleLines = wrapText(ctx, invitation.title, W - 160).slice(0, 2);
      titleLines.forEach((l, i) => ctx.fillText(l, W / 2, textTop + i * 88));

      let y = textTop + titleLines.length * 88 + 60;
      ctx.fillStyle = "#5b5766";
      ctx.font = "44px Pretendard, sans-serif";
      ctx.fillText(dateText, W / 2, y);
      if (locationText) {
        y += 64;
        wrapText(ctx, `📍 ${locationText}`, W - 160)
          .slice(0, 2)
          .forEach((l, i) => ctx.fillText(l, W / 2, y + i * 56));
      }

      // 브랜드 워드마크
      ctx.fillStyle = "#a78bfa";
      ctx.font = "bold 48px Pretendard, sans-serif";
      ctx.fillText("WARA", W / 2, H - 90);

      setReady(true);
    };

    const coverUrl =
      invitation.mainImageThumbnailUrl ?? invitation.mainImageUrl ?? null;
    if (coverUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => draw(img);
      img.onerror = () => draw(); // CORS/로드 실패 시 텍스트 전용
      img.src = coverUrl;
    } else {
      draw();
    }
  }, [open, invitation, dateText, locationText]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("이미지를 만들지 못했어요");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${invitation.title}_flyer.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch {
      toast.error("이미지 저장에 실패했어요");
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="플라이어 만들기"
      description="초대장을 이미지로 저장해 공유하세요"
    >
      <div className="flex flex-col items-center gap-3 pt-1">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full max-w-[280px] rounded-lg border border-border"
        />
        <Button fullWidth size="lg" disabled={!ready} onClick={handleSave}>
          이미지 저장
        </Button>
      </div>
    </BottomSheet>
  );
}
