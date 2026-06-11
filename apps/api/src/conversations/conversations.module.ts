import { Module } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsGateway } from './conversations.gateway';

@Module({
  imports: [FriendsModule],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    ConversationsRepository,
    ConversationsGateway,
  ],
  exports: [ConversationsService],
})
export class ConversationsModule {}
