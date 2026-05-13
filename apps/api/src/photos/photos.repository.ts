import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../database/database.module';

@Injectable()
export class PhotosRepository {
  constructor(@Inject(DRIZZLE) private db: any) {}
}
