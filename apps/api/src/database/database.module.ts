import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../drizzle/schema';
export const DRIZZLE = Symbol('DRIZZLE');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.getOrThrow<string>('DATABASE_URL');
        const client = postgres(url);
        return drizzle(client, { schema, casing: 'snake_case' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;
