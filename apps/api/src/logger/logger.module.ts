import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

// pino-http customLogLevel: 'silent'로 지정하면 해당 요청 로그 생략.
// /api/health 같은 health check 로그는 매 분 들어와서 noise.
const SILENT_PATHS = new Set(['/api/health']);

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: isProd ? 'info' : 'debug',
            genReqId: (req: IncomingMessage) => {
              const header = req.headers['x-request-id'];
              return typeof header === 'string' && header.length > 0
                ? header
                : randomUUID();
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["set-cookie"]',
                'res.headers["set-cookie"]',
                'req.body.password',
                'req.body.refreshToken',
                'req.body.accessToken',
                'req.body.code',
                'req.body.providerToken',
                'req.body.idToken',
              ],
              censor: '[REDACTED]',
            },
            customLogLevel: (
              req: IncomingMessage,
              res: ServerResponse,
              err: Error | undefined,
            ) => {
              if (req.url && SILENT_PATHS.has(req.url)) return 'silent';
              if (res.statusCode >= 500 || err) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            transport: isProd
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    singleLine: true,
                    translateTime: 'HH:MM:ss.l',
                    ignore: 'pid,hostname',
                  },
                },
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
