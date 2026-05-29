import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AdminOnly } from '../common/decorators/admin-only.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseUlidPipe } from '../common/pipes/parse-ulid.pipe';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../common/types/jwt-payload.type';
import { CreateTermSchema, type CreateTermDto } from './dto/create-term.dto';
import { UpdateTermSchema, type UpdateTermDto } from './dto/update-term.dto';
import { TermsService } from './terms.service';

@Controller('admin/terms')
@AdminOnly()
export class AdminTermsController {
  constructor(private readonly termsService: TermsService) {}

  @Get()
  findAll() {
    return this.termsService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(CreateTermSchema)) dto: CreateTermDto,
  ) {
    return this.termsService.create(dto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUlidPipe) id: string,
    @Body(new ZodValidationPipe(UpdateTermSchema)) dto: UpdateTermDto,
  ) {
    return this.termsService.update(id, dto);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseUlidPipe) id: string) {
    return this.termsService.activate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  softDelete(@Param('id', ParseUlidPipe) id: string) {
    return this.termsService.softDelete(id);
  }
}
