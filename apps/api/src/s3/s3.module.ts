// s3.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service';
import { S3_CLIENT } from './s3.constants';

@Global()
@Module({
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // AWS_S3_ENDPOINT가 있으면 로컬 S3(minio) 등으로 연결 (path-style + 명시 자격증명).
        // 없으면 기존대로 AWS S3 (기본 자격증명 체인).
        const endpoint = config.get<string>('AWS_S3_ENDPOINT');
        return new S3Client({
          region: config.getOrThrow('AWS_REGION'),
          ...(endpoint
            ? {
                endpoint,
                forcePathStyle: true,
                credentials: {
                  accessKeyId: config.getOrThrow('AWS_ACCESS_KEY_ID'),
                  secretAccessKey: config.getOrThrow('AWS_SECRET_ACCESS_KEY'),
                },
              }
            : {}),
        });
      },
    },
    S3Service,
  ],
  exports: [S3_CLIENT, S3Service],
})
export class S3Module {}