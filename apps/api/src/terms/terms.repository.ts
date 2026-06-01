import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDB } from '../database/database.module';
import {
  serviceTerms,
  userTermAgreements,
  type NewServiceTerm,
} from '../database/schema';

@Injectable()
export class TermsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAllActive() {
    return this.db.query.serviceTerms.findMany({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.isActive, true), isNull(t.deletedAt)),
      orderBy: (t, { asc }) => asc(t.termType),
    });
  }

  findById(id: string) {
    return this.db.query.serviceTerms.findFirst({
      where: (t, { and, eq, isNull }) =>
        and(eq(t.id, id), isNull(t.deletedAt)),
    });
  }

  findAll() {
    return this.db.query.serviceTerms.findMany({
      where: (t, { isNull }) => isNull(t.deletedAt),
      orderBy: (t, { asc }) => [asc(t.termType), asc(t.createdAt)],
    });
  }

  async create(data: NewServiceTerm) {
    const [result] = await this.db
      .insert(serviceTerms)
      .values(data)
      .returning();
    return result!;
  }

  async update(
    id: string,
    data: Partial<Pick<NewServiceTerm, 'title' | 'content' | 'isRequired' | 'publishedAt'>>,
  ) {
    const [result] = await this.db
      .update(serviceTerms)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(serviceTerms.id, id), isNull(serviceTerms.deletedAt)))
      .returning();
    return result ?? null;
  }

  async activate(id: string) {
    return this.db.transaction(async (tx) => {
      const term = await tx.query.serviceTerms.findFirst({
        where: (t, { and, eq, isNull }) => and(eq(t.id, id), isNull(t.deletedAt)),
      });
      if (!term) return null;

      await tx
        .update(serviceTerms)
        .set({ isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(serviceTerms.termType, term.termType),
            eq(serviceTerms.isActive, true),
          ),
        );

      const [result] = await tx
        .update(serviceTerms)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(serviceTerms.id, id))
        .returning();
      return result!;
    });
  }

  async softDelete(id: string) {
    const [result] = await this.db
      .update(serviceTerms)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(serviceTerms.id, id), isNull(serviceTerms.deletedAt)))
      .returning();
    return result ?? null;
  }

  findAgreementByUserAndTerm(userId: string, termId: string) {
    return this.db.query.userTermAgreements.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.userId, userId), eq(t.termId, termId)),
    });
  }

  async createAgreements(userId: string, termIds: string[]) {
    return this.db
      .insert(userTermAgreements)
      .values(termIds.map((termId) => ({ userId, termId })))
      .returning();
  }

  findAgreementsByUser(userId: string) {
    return this.db.query.userTermAgreements.findMany({
      where: (t, { eq }) => eq(t.userId, userId),
      with: { term: true },
    });
  }
}
