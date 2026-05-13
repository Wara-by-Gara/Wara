import { SetMetadata } from '@nestjs/common';

export const ADMIN_ACTION_KEY = 'adminAction';

export type AdminActionMeta = {
  action: string;
  targetType?: string;
};

export const AdminAction = (action: string, targetType?: string) =>
  SetMetadata(ADMIN_ACTION_KEY, { action, targetType } satisfies AdminActionMeta);
