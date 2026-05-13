import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';

@Injectable()
export class UsersRepository {
  constructor(@Inject(DRIZZLE) private db: any) {}
}
