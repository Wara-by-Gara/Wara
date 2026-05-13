import { UserRole } from '../enums/role.enum';

export type JwtPayload = {
  id: string;
  role: UserRole;
  scope: string[];
  iat?: number;
  exp?: number;
};

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}
