import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import * as schema from '../../drizzle/schema';
import type { NewInquiry } from '../../drizzle/schema';

@Injectable()
export class InquiriesRepository {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async create(userId: string, data: Omit<NewInquiry, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deletedAt'>) {
    const result = await this.db
      .insert(schema.inquiries)
      .values({ userId, ...data })
      .returning();
    return result[0];
  }

  async findById(id: string) {
    const result = await this.db
      .select()
      .from(schema.inquiries)
      .where(and(eq(schema.inquiries.id, id), isNull(schema.inquiries.deletedAt)))
      .limit(1);
    return result[0] ?? null;
  }

  async findByUserId(userId: string) {
    return this.db
      .select()
      .from(schema.inquiries)
      .where(and(eq(schema.inquiries.userId, userId), isNull(schema.inquiries.deletedAt)))
      .orderBy(desc(schema.inquiries.createdAt));
  }

  async update(id: string, data: { title: string; content: string }) {
    const result = await this.db
      .update(schema.inquiries)
      .set({ title: data.title, content: data.content, updatedAt: new Date() })
      .where(eq(schema.inquiries.id, id))
      .returning();
    return result[0];
  }

  async softDelete(id: string) {
    const result = await this.db
      .update(schema.inquiries)
      .set({ deletedAt: new Date() })
      .where(eq(schema.inquiries.id, id))
      .returning();
    return result[0];
  }

  async findAll() {
    return this.db
      .select()
      .from(schema.inquiries)
      .orderBy(desc(schema.inquiries.createdAt));
  }

  async answer(id: string, adminId: string, data: { answer: string; status: 'in_progress' | 'resolved' }) {
    const result = await this.db
      .update(schema.inquiries)
      .set({ answer: data.answer, status: data.status as any, adminId, answeredAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.inquiries.id, id))
      .returning();
    return result[0];
  }
}
