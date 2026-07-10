import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import type { SettlementSummary } from './settlements.service';

const WIDTH = 800;
const ROW_H = 40;
const HEADER_H = 140;
const PADDING = 40;

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;',
  );
}

function won(n: number): string {
  return `₩${n.toLocaleString('ko-KR')}`;
}

@Injectable()
export class SettlementImageService {
  /** 정산 요약을 카드 이미지(PNG)로 렌더. */
  async renderCard(summary: SettlementSummary): Promise<Buffer> {
    const rows = summary.transfers.length > 0 ? summary.transfers : [];
    const height = HEADER_H + Math.max(rows.length, 1) * ROW_H + PADDING * 2;

    const transferLines = rows
      .map((t, i) => {
        const y = HEADER_H + PADDING + i * ROW_H;
        const text = `${escapeXml(t.fromName)}  →  ${escapeXml(t.toName)}`;
        return `
          <text x="${PADDING}" y="${y}" font-size="24" fill="#111827">${text}</text>
          <text x="${WIDTH - PADDING}" y="${y}" font-size="24" fill="#2563eb" text-anchor="end" font-weight="bold">${won(t.amount)}</text>`;
      })
      .join('');

    const emptyLine =
      rows.length === 0
        ? `<text x="${PADDING}" y="${HEADER_H + PADDING}" font-size="22" fill="#9ca3af">정산할 송금이 없어요</text>`
        : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}">
      <rect width="${WIDTH}" height="${height}" fill="#ffffff"/>
      <rect width="${WIDTH}" height="8" fill="#2563eb"/>
      <text x="${PADDING}" y="70" font-size="34" font-weight="bold" fill="#111827">정산 요약</text>
      <text x="${PADDING}" y="110" font-size="22" fill="#6b7280">총 ${won(summary.total)} · 송금 ${rows.length}건</text>
      ${transferLines}
      ${emptyLine}
    </svg>`;

    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}
