import { UserRole } from '../enums/role.enum';

export interface JwtPayload {
  id: string;
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
