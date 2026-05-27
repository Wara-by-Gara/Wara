import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { faqItems } from '../database/schema';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import type { CreateFaqDto } from './dto/create-faq.dto';
import type { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findActive() {
    return this.db
      .select()
      .from(faqItems)
      .where(and(isNull(faqItems.deletedAt), eq(faqItems.isActive, true)))
      .orderBy(asc(faqItems.sortOrder), asc(faqItems.createdAt));
  }

  findAll() {
    return this.db
      .select()
      .from(faqItems)
      .where(isNull(faqItems.deletedAt))
      .orderBy(asc(faqItems.sortOrder), asc(faqItems.createdAt));
  }

  async findById(id: string) {
    const [item] = await this.db
      .select()
      .from(faqItems)
      .where(and(eq(faqItems.id, id), isNull(faqItems.deletedAt)));
    return item ?? null;
  }

  async create(data: CreateFaqDto & { createdBy: string }) {
    const [item] = await this.db.insert(faqItems).values(data).returning();
    return item;
  }

  async update(id: string, data: UpdateFaqDto) {
    const [item] = await this.db
      .update(faqItems)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(faqItems.id, id), isNull(faqItems.deletedAt)))
      .returning();
    return item ?? null;
  }

  async softDelete(id: string) {
    await this.db
      .update(faqItems)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(faqItems.id, id), isNull(faqItems.deletedAt)));
  }
}
