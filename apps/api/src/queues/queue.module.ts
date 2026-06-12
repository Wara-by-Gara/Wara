import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_REDIS_URL } from '../redis/redis.constants';
import { IMAGE_PROCESSING_QUEUE } from './queue.constants';

// BullMQ는 connection options를 자체로 받아 내부에서 ioredis 인스턴스 생성.
// maxRetriesPerRequest: null은 blocking command(BRPOP)을 위한 공식 권장값.
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const raw = config.get<string>('REDIS_URL') ?? DEFAULT_REDIS_URL;
        const url = new URL(raw);
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port) || 6379,
            password: url.password || undefined,
            db: url.pathname ? Number(url.pathname.slice(1)) || 0 : 0,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue({ name: IMAGE_PROCESSING_QUEUE }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
