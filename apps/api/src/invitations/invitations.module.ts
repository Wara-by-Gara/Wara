import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TemplatesModule } from '../templates/templates.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';

@Module({
  imports: [AuthModule, TemplatesModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository],
})
export class InvitationsModule {}