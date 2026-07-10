import { z } from 'zod';
import { findDuplicateVoteSlotKey } from '../vote-slot.util';

const slotSchema = z.object({
  date:      z.string()
               .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
               .refine((d) => !isNaN(new Date(d).getTime()), 'invalid calendar date')
               .optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM').optional(),
  label:     z.string().trim().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createPollSchema = z.object({
  voteType:    z.enum(['date', 'custom']).default('date'),
  title:       z.string().trim().min(1).max(100).optional(),
  closesAt:    z.string()
                .datetime()
                .refine((d) => new Date(d) > new Date(), 'closesAt must be in the future')
                .optional(),
  isAnonymous: z.boolean().default(false),
  slots:       z.array(slotSchema).min(1).max(30),
}).superRefine((dto, ctx) => {
  // 타입별 슬롯 형식 검증
  for (let i = 0; i < dto.slots.length; i++) {
    const s = dto.slots[i]!;
    if (dto.voteType === 'date') {
      if (!s.date) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'date poll slot requires date', path: ['slots', i, 'date'] });
      }
      if (s.label) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'date poll slot must not have label', path: ['slots', i, 'label'] });
      }
    } else {
      if (!s.label) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'custom poll slot requires label', path: ['slots', i, 'label'] });
      }
      if (s.date || s.startTime) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'custom poll slot must not have date/startTime', path: ['slots', i] });
      }
    }
  }
  if (findDuplicateVoteSlotKey(dto.slots)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'duplicate slot', path: ['slots'] });
  }
});

export type CreatePollDto = z.infer<typeof createPollSchema>;
