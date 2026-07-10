import { z } from 'zod';

export const updateSlotSchema = z
  .object({
    date:      z.string()
                 .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
                 .refine((d) => !isNaN(new Date(d).getTime()), 'invalid calendar date')
                 .nullable()
                 .optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM').nullable().optional(),
    label:     z.string().trim().min(1).max(100).optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine(
    (v) =>
      v.date !== undefined ||
      v.startTime !== undefined ||
      v.label !== undefined ||
      v.sortOrder !== undefined,
    '수정할 항목이 없습니다.',
  );

export type UpdateSlotDto = z.infer<typeof updateSlotSchema>;
