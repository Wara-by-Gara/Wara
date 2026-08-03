import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, desc, count, SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import * as schema from '../database/schema';
import type { NewInquiry } from '../database/schema';

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
    const condition = and(eq(schema.inquiries.userId, userId), isNull(schema.inquiries.deletedAt));
    const [items, countResult] = await Promise.all([
      this.db.select().from(schema.inquiries).where(condition).orderBy(desc(schema.inquiries.createdAt)),
      this.db.select({ total: count() }).from(schema.inquiries).where(condition),
    ]);
    return { items, total: countResult[0]?.total ?? 0 };
  }

  async update(id: string, data: { title: string; content: string; isPublic?: boolean }) {
    const result = await this.db
      .update(schema.inquiries)
      .set({ title: data.title, content: data.content, ...(data.isPublic !== undefined && { isPublic: data.isPublic }), updatedAt: new Date() })
      .where(eq(schema.inquiries.id, id))
      .returning();
    return result[0];
  }

  async findAllPublic() {
    const condition = and(eq(schema.inquiries.isPublic, true), isNull(schema.inquiries.deletedAt)) as SQL;
    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: schema.inquiries.id,
          userId: schema.inquiries.userId,
          inquiryType: schema.inquiries.inquiryType,
          status: schema.inquiries.status,
          title: schema.inquiries.title,
          content: schema.inquiries.content,
          isPublic: schema.inquiries.isPublic,
          answer: schema.inquiries.answer,
          answeredAt: schema.inquiries.answeredAt,
          adminId: schema.inquiries.adminId,
          createdAt: schema.inquiries.createdAt,
          updatedAt: schema.inquiries.updatedAt,
          authorNickname: schema.users.nickname,
        })
        .from(schema.inquiries)
        .leftJoin(schema.users, eq(schema.inquiries.userId, schema.users.id))
        .where(condition)
        .orderBy(desc(schema.inquiries.createdAt)),
      this.db.select({ total: count() }).from(schema.inquiries).where(condition),
    ]);
    return { items, total: countResult[0]?.total ?? 0 };
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
    const adminUser = alias(schema.users, 'admin_user');
    const condition = isNull(schema.inquiries.deletedAt);
    const [items, countResult] = await Promise.all([
      this.db
        .select({
          id: schema.inquiries.id,
          userId: schema.inquiries.userId,
          inquiryType: schema.inquiries.inquiryType,
          status: schema.inquiries.status,
          title: schema.inquiries.title,
          content: schema.inquiries.content,
          isPublic: schema.inquiries.isPublic,
          answer: schema.inquiries.answer,
          answeredAt: schema.inquiries.answeredAt,
          adminId: schema.inquiries.adminId,
          adminNickname: adminUser.nickname,
          createdAt: schema.inquiries.createdAt,
          updatedAt: schema.inquiries.updatedAt,
        })
        .from(schema.inquiries)
        .leftJoin(adminUser, eq(schema.inquiries.adminId, adminUser.id))
        .where(condition)
        .orderBy(desc(schema.inquiries.createdAt)),
      this.db.select({ total: count() }).from(schema.inquiries).where(condition),
    ]);
    return { items, total: countResult[0]?.total ?? 0 };
  }

  async answer(id: string, adminId: string, data: { answer: string; status: 'in_progress' | 'resolved' }) {
    const result = await this.db
      .update(schema.inquiries)
      .set({ answer: data.answer, status: data.status, adminId, answeredAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.inquiries.id, id))
      .returning();
    return result[0];
  }
}
