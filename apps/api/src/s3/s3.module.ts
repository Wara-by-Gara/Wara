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
        return new S3Client({ region: config.getOrThrow('AWS_REGION') });
      },
    },
    S3Service,
  ],
  exports: [S3_CLIENT, S3Service],
})
export class S3Module {}