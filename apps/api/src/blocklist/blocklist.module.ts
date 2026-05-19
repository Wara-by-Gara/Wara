import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BlocklistController } from './blocklist.controller';
import { BlocklistService } from './blocklist.service';
import { BlocklistsRepository } from './blocklists.repository';

@Module({
  imports: [AuthModule],
  controllers: [BlocklistController],
  providers: [BlocklistService, BlocklistsRepository],
})
export class BlocklistModule {}
