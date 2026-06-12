import { Global, Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  DEFAULT_REDIS_URL,
  REDIS_CLIENT,
  REDIS_PUB,
  REDIS_SUB,
} from './redis.constants';

const logger = new Logger('RedisModule');

function createClient(url: string, role: string): Redis {
  const client = new Redis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });
  client.on('error', (err) => {
    logger.error(`[${role}] ${err.message}`);
  });
  return client;
}

function clientFactory(role: string) {
  return (config: ConfigService): Redis => {
    const url = config.get<string>('REDIS_URL');
    if (!url && process.env.NODE_ENV === 'production') {
      throw new Error('REDIS_URL is required in production');
    }
    return createClient(url ?? DEFAULT_REDIS_URL, role);
  };
}

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: clientFactory('client'),
    },
    {
      provide: REDIS_PUB,
      inject: [ConfigService],
      useFactory: clientFactory('pub'),
    },
    {
      provide: REDIS_SUB,
      inject: [ConfigService],
      useFactory: clientFactory('sub'),
    },
  ],
  exports: [REDIS_CLIENT, REDIS_PUB, REDIS_SUB],
})
export class RedisModule implements OnModuleDestroy {
  constructor(
    @Inject(REDIS_CLIENT) private readonly client: Redis,
    @Inject(REDIS_PUB) private readonly pub: Redis,
    @Inject(REDIS_SUB) private readonly sub: Redis,
  ) {}

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled(
      [this.client, this.pub, this.sub].map((c) =>
        c.status === 'end' ? Promise.resolve() : c.quit(),
      ),
    );
  }
}
