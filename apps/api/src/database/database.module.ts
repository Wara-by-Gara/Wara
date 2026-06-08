import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { instrumentPostgresClient } from './instrument';
export const DRIZZLE = Symbol('DRIZZLE');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.getOrThrow<string>('DATABASE_URL');
        const client = instrumentPostgresClient(postgres(url));
        return drizzle(client, { schema, casing: 'snake_case' });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;
export type DrizzleTx = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];
