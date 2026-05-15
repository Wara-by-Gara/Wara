import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database/database.module';
import { invitationTemplates } from '../../drizzle/schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  findAll() {
    return this.db.query.invitationTemplates.findMany({
      where: (t, { eq }) => eq(t.isActive, true),
    });
  }

  findById(id: string) {
    return this.db.query.invitationTemplates.findFirst({
      where: (t, { eq }) => eq(t.id, id),
    });
  }

  async create(dto: CreateTemplateDto) {
    const [created] = await this.db
      .insert(invitationTemplates)
      .values({ ...dto, isActive: dto.isActive ?? true })
      .returning();
    return created;
  }

  async update(id: string, dto: UpdateTemplateDto) {
    const [updated] = await this.db
      .update(invitationTemplates)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(invitationTemplates.id, id))
      .returning();
    return updated;
  }

  async remove(id: string) {
    const [removed] = await this.db
      .update(invitationTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(invitationTemplates.id, id))
      .returning();
    return removed;
  }
}
