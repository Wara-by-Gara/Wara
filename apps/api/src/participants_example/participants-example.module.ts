import { Module } from '@nestjs/common';
import { ParticipantsExampleController } from './participants-example.controller';
import { ParticipantsExampleService } from './participants-example.service';
import { ParticipantsExampleRepository } from './participants-example.repository';

/**
 * 참가자 관리 모듈 (레퍼런스)
 *
 * 의존성 구조:
 *   Controller → Service → Repository → DRIZZLE(DB)
 *
 * DatabaseModule은 @Global()이므로 import 불필요
 * DRIZZLE 토큰은 Repository에서 자동 주입됨
 */
@Module({
  controllers: [ParticipantsExampleController],
  providers: [ParticipantsExampleService, ParticipantsExampleRepository],
})
export class ParticipantsExampleModule {}
