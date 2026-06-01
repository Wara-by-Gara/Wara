import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_TERMS_CHECK_KEY } from '../decorators/skip-terms-check.decorator';
import { ErrorCode } from '../constants/error-codes';
import { DRIZZLE, type DrizzleDB } from '../../database/database.module';

@Injectable()
export class RequiredTermsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipCheck = this.reflector.getAllAndOverride<boolean>(SKIP_TERMS_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipCheck) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) return true;

    const required = await this.db.query.serviceTerms.findMany({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.isActive, true), eq(t.isRequired, true), isNull(t.deletedAt)),
    });

    if (required.length === 0) return true;

    const requiredIds = required.map((t) => t.id);
    const agreements = await this.db.query.userTermAgreements.findMany({
      where: (t, { and, eq, inArray }) =>
        and(eq(t.userId, user.id), inArray(t.termId, requiredIds)),
    });

    if (agreements.length < required.length) {
      throw new ForbiddenException(ErrorCode.TERMS_AGREEMENT_REQUIRED);
    }

    return true;
  }
}
