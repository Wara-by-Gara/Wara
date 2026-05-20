import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { ulid } from 'ulid';
import { invitations, participants } from './invitations';

export const missionTemplates = pgTable('mission_templates', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  content: text('content').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const missions = pgTable('missions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => ulid()),
  invitationId: text('invitation_id')
    .notNull()
    .references(() => invitations.id, { onDelete: 'cascade' }),
  participantId: text('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  // 초대장별 미션 목록 조회 (findManyByInvitationId)
  index('idx_missions_invitation_id').on(t.invitationId),
]);

export const missionAssignments = pgTable(
  'mission_assignments',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => ulid()),
    missionId: text('mission_id')
      .notNull()
      .references(() => missions.id, { onDelete: 'cascade' }),
    participantId: text('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('uq_mission_assignments_mission_participant').on(
      t.missionId,
      t.participantId,
    ),
    // 내 배정 미션 조회 (findAssignedMissionForParticipant): participant_id 기준
    index('idx_mission_assignments_participant_id').on(t.participantId),
  ],
);

export type Mission = typeof missions.$inferSelect;
export type MissionTemplate = typeof missionTemplates.$inferSelect;
export type MissionAssignment = typeof missionAssignments.$inferSelect;
