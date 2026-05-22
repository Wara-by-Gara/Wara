import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TemplatesModule } from '../templates/templates.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [AuthModule, TemplatesModule, S3Module],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository],
})
export class InvitationsModule {}
