import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { TemplatesRepository } from '../templates/templates.repository';

@Module({
  imports: [AuthModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository, TemplatesRepository],
})
export class InvitationsModule {}
