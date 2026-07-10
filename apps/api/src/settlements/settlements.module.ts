import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SettlementsController } from './settlements.controller';
import { PublicSettlementController } from './public-settlement.controller';
import { SettlementsService } from './settlements.service';
import { SettlementsRepository } from './settlements.repository';
import { SettlementImageService } from './settlement-image.service';

/** 비용 정산(R-QXNIND). 항목 CRUD·최소송금 계산·확정·공유링크·이미지 카드. */
@Module({
  imports: [AuthModule],
  controllers: [SettlementsController, PublicSettlementController],
  providers: [SettlementsService, SettlementsRepository, SettlementImageService],
})
export class SettlementsModule {}
