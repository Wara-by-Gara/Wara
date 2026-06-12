import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import type Redis from 'ioredis';
import { Server, ServerOptions } from 'socket.io';
import { REDIS_PUB, REDIS_SUB } from '../redis/redis.constants';

const logger = new Logger('WaraIoAdapter');

export class WaraIoAdapter extends IoAdapter {
  private readonly origin: string;
  private readonly pubClient: Redis;
  private readonly subClient: Redis;

  constructor(app: INestApplicationContext) {
    super(app);
    const config = app.get(ConfigService);
    const url = config.getOrThrow<string>('FRONTEND_URL');
    this.origin = url.replace(/\/$/, '');
    this.pubClient = app.get<Redis>(REDIS_PUB);
    this.subClient = app.get<Redis>(REDIS_SUB);
  }

  override createIOServer(port: number, options?: ServerOptions): unknown {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.origin,
        credentials: true,
      },
      // ALB idle timeout(기본 60s) 전에 ping을 주고받아 연결 유지.
      // 25s마다 ping, 20s 내 pong 없으면 끊김 판정 (socket.io 기본값을 명시화).
      pingInterval: 25_000,
      pingTimeout: 20_000,
    }) as Server;
    // Redis 어댑터는 멀티 인스턴스(prod) 전용. 단일 인스턴스(로컬)에선 in-memory가
    // 더 빠르고 안정적이라 건너뛴다. (SOCKET_REDIS_ADAPTER=true로 강제 가능)
    const useRedis =
      process.env.NODE_ENV === 'production' ||
      process.env.SOCKET_REDIS_ADAPTER === 'true';
    if (useRedis) {
      server.adapter(createAdapter(this.pubClient, this.subClient));
      logger.log('Socket.IO Redis adapter attached');
    } else {
      logger.log('Socket.IO in-memory adapter (single instance)');
    }
    return server;
  }
}
