import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { S3Module } from '../s3/s3.module';
import { TemplatesModule } from '../templates/templates.module';
import { AiGenerationsController } from './ai-generations.controller';
import { AiGenerationsGateway } from './ai-generations.gateway';
import { AiGenerationsRepository } from './ai-generations.repository';
import { AiGenerationsService } from './ai-generations.service';

@Module({
  // AiModule은 @Global이라 import 불필요. AuthModule은 Gateway가 JwtService를 쓰므로 필요.
  imports: [AuthModule, InvitationsModule, S3Module, TemplatesModule],
  controllers: [AiGenerationsController],
  providers: [AiGenerationsService, AiGenerationsRepository, AiGenerationsGateway],
})
export class AiGenerationsModule {}
