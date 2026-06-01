import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SkipTermsCheck } from '../common/decorators/skip-terms-check.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { AgreeTermsSchema, type AgreeTermsDto } from './dto/agree-terms.dto';
import { TermsService } from './terms.service';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Public()
  @Get()
  findAll() {
    return this.termsService.findAllActive();
  }

  // agreements/me must be declared before :id to avoid route shadowing
  @SkipTermsCheck()
  @Get('agreements/me')
  findMyAgreements(@CurrentUser() user: JwtPayload) {
    return this.termsService.findMyAgreements(user.id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUlidPipe) id: string) {
    return this.termsService.findById(id);
  }

  @SkipTermsCheck()
  @Post('agreements')
  @HttpCode(HttpStatus.CREATED)
  agreeTerms(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(AgreeTermsSchema)) dto: AgreeTermsDto,
  ) {
    return this.termsService.agreeTerms(user.id, dto);
  }
}
