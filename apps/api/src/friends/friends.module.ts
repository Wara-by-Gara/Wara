import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { S3Module } from '../s3/s3.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { FriendsRepository } from './friends.repository';

@Module({
  imports: [AuthModule, S3Module],
  controllers: [FriendsController],
  providers: [FriendsService, FriendsRepository],
  exports: [FriendsRepository],
})
export class FriendsModule {}
