import { Controller, Get, HttpCode, Inject } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { sql } from 'drizzle-orm';
import { Public } from '../common/decorators/public.decorator';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';

const VERSION = process.env.npm_package_version ?? '0.0.0';

@Controller('health')
export class HealthController {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  @Get()
  @Public()
  @SkipThrottle()
  @HttpCode(200)
  async check() {
    let db: 'ok' | 'error' = 'ok';
    try {
      await this.db.execute(sql`SELECT 1`);
    } catch {
      db = 'error';
    }
    return {
      status: db === 'ok' ? 'ok' : 'error',
      db,
      uptime: Math.floor(process.uptime()),
      version: VERSION,
    };
  }
}
