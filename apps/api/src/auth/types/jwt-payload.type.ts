import { UserRole } from '../enums/role.enum';

export interface JwtPayload {
  userId: string;
  role: UserRole;
  scope: string[];
  iat?: number;
  exp?: number;
}

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
