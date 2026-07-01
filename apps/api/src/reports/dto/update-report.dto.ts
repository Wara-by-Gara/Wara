import { z } from 'zod';

export const updateReportSchema = z
  .object({
    status:    z.enum(['pending', 'reviewing', 'resolved', 'dismissed']).optional(),
    adminMemo: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.status !== undefined || d.adminMemo !== undefined, {
    message: '수정할 항목이 없습니다.',
  });

export type UpdateReportDto = z.infer<typeof updateReportSchema>;

export const listReportsSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'resolved', 'dismissed']).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
});

export type ListReportsDto = z.infer<typeof listReportsSchema>;
