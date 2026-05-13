import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IAuthStrategy } from './auth-strategy.interface';
import { JwtPayload } from '../../common/types/jwt-payload.type';

@Injectable()
export class JwtAuthStrategy implements IAuthStrategy<JwtPayload> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async validate(token: string): Promise<JwtPayload> {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
    });
  }
}
