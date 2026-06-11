import { z } from 'zod';
import { PUBLIC_INVITATION_CATEGORIES } from './list-public-invitations.dto';

// bbox 면적 상한 — 시·도 단위(~5도) 정도. 전국 단위 조회를 막아 마커 폭주 방지.
const BBOX_MAX_DEGREES = 5;

const LatSchema = z.coerce.number().min(-90).max(90);
const LngSchema = z.coerce.number().min(-180).max(180);

export const ListPublicMapInvitationsSchema = z
  .object({
    neLat: LatSchema,
    neLng: LngSchema,
    swLat: LatSchema,
    swLng: LngSchema,
    category: z.enum(PUBLIC_INVITATION_CATEGORIES).optional(),
    limit: z.coerce.number().int().min(1).max(500).default(200),
  })
  .refine((d) => d.neLat >= d.swLat, {
    message: 'neLat must be greater than or equal to swLat',
    path: ['neLat'],
  })
  .refine((d) => d.neLng >= d.swLng, {
    message: 'neLng must be greater than or equal to swLng',
    path: ['neLng'],
  })
  .refine((d) => d.neLat - d.swLat <= BBOX_MAX_DEGREES, {
    message: `latitude span must be ≤ ${BBOX_MAX_DEGREES}°`,
    path: ['neLat'],
  })
  .refine((d) => d.neLng - d.swLng <= BBOX_MAX_DEGREES, {
    message: `longitude span must be ≤ ${BBOX_MAX_DEGREES}°`,
    path: ['neLng'],
  });

export type ListPublicMapInvitationsDto = z.infer<
  typeof ListPublicMapInvitationsSchema
>;
