import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParticipantsExampleService } from './participants-example.service';
import { JoinInvitationSchema, JoinInvitationDto } from './dto/join-invitation.dto';
import { UpdateRsvpSchema, UpdateRsvpDto } from './dto/update-rsvp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

/**
 * 참가자 관리 컨트롤러 레퍼런스
 *
 * 새 도메인 만들 때:
 * 1. 클래스명·메서드명을 자신의 도메인으로 변경
 * 2. @Controller 경로를 복수형 소문자로 변경
 * 3. Service·DTO·Schema를 자신의 도메인으로 교체
 * 4. 불필요한 엔드포인트는 삭제
 */
@Controller('invitations/:invitationId/participants-example')
export class ParticipantsExampleController {
  constructor(private readonly service: ParticipantsExampleService) {}

  /**
   * GET /invitations/:invitationId/participants-example
   * ParseUlidPipe: ULID 형식 틀리면 자동 400
   */
  @Get()
  findAll(@Param('invitationId', ParseUlidPipe) invitationId: string) {
    return this.service.findAll(invitationId);
  }

  /**
   * POST /invitations/:invitationId/participants-example
   * @UseGuards: 토큰 없으면 자동 401
   * @CurrentUser(): 토큰에서 { id, email, role } 추출
   * ZodValidationPipe: Zod 스키마로 body 검증
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  join(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(JoinInvitationSchema)) _dto: JoinInvitationDto,
  ) {
    return this.service.join(user.id, invitationId);
  }

  /**
   * PATCH /invitations/:invitationId/participants-example/:id
   * 소유권 체크는 Service에서 수행 (Controller 책임 아님)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateRsvp(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(UpdateRsvpSchema)) dto: UpdateRsvpDto,
  ) {
    return this.service.updateRsvp(user.id, id, dto);
  }

  /**
   * DELETE /invitations/:invitationId/participants-example/:id
   * @HttpCode(204): 삭제 성공 시 본문 없이 204 반환
   * SKILL Rule: 삭제 엔드포인트는 반드시 204
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  leave(
    @Param('invitationId', ParseUlidPipe) invitationId: string,
    @Param('id', ParseUlidPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.service.leave(user.id, id);
  }
}
