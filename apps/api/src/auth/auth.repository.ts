import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.db.insert(refreshTokens).valuss(data);
  }
}
