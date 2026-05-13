export type JwtPayload = {
  id: string;
  role: 'member' | 'admin';
  scope: string[];
};
