import { z } from 'zod';

// 비용 항목 생성/수정 공통 스키마 (수정은 항목 전체를 교체).
// equal: participantIds(분배 대상)로 균등 분배. custom: shares(개인별 금액) 합 = amount.
export const upsertExpenseSchema = z
  .object({
    title:              z.string().trim().min(1).max(100),
    amount:             z.number().int().positive(),
    payerParticipantId: z.string().min(1),
    splitType:          z.enum(['equal', 'custom']),
    participantIds:     z.array(z.string().min(1)).min(1).optional(),
    shares:             z.array(z.object({
                          participantId: z.string().min(1),
                          share:         z.number().int().min(0),
                        })).min(1).optional(),
  })
  .superRefine((dto, ctx) => {
    if (dto.splitType === 'equal') {
      if (!dto.participantIds || dto.participantIds.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'equal 분배는 participantIds가 필요합니다.', path: ['participantIds'] });
      } else if (new Set(dto.participantIds).size !== dto.participantIds.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'participantIds 중복', path: ['participantIds'] });
      }
    } else {
      if (!dto.shares || dto.shares.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'custom 분배는 shares가 필요합니다.', path: ['shares'] });
      } else {
        const ids = dto.shares.map((s) => s.participantId);
        if (new Set(ids).size !== ids.length) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'shares participantId 중복', path: ['shares'] });
        }
        const sum = dto.shares.reduce((acc, s) => acc + s.share, 0);
        if (sum !== dto.amount) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: `shares 합(${sum})이 amount(${dto.amount})와 달라요.`, path: ['shares'] });
        }
      }
    }
  });

export type UpsertExpenseDto = z.infer<typeof upsertExpenseSchema>;
