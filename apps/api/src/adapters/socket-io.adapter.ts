import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class WaraIoAdapter extends IoAdapter {
  private readonly origin: string;

  constructor(app: INestApplication) {
    super(app);
    const config = app.get(ConfigService);
    const url = config.getOrThrow<string>('FRONTEND_URL');
    this.origin = url.replace(/\/$/, '');
  }

  override createIOServer(port: number, options?: ServerOptions): unknown {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.origin,
        credentials: true,
      },
    });
  }
}
