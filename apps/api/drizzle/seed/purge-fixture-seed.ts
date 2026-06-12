/**
 * fixtures(SEEDS) 기반 테스트 데이터만 삭제한다.
 * - @wara.dev 시드 유저 및 SEEDS에 정의된 행(초대장·사진·FAQ 등)
 * - service_terms / invitation_templates 는 삭제하지 않음 (실유저 약관 동의·초대장 FK 보호, essential 시드 upsert로 갱신)
 *
 * EC2:
 *   pnpm exec dotenv -e /home/ubuntu/.env.production -- ts-node -r tsconfig-paths/register drizzle/seed/purge-fixture-seed.ts
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { inArray, like } from 'drizzle-orm';
import * as schema from '../../src/database/schema';
import {
  aiImageJobs,
  dateVotePolls,
  dateVoteResponses,
  dateVoteSlots,
  eventLocations,
  faqItems,
  feedbackLikes,
  feedbacks,
  invitationBlocklists,
  invitationLinkEvents,
  invitationSendLogs,
  invitations,
  missionAssignments,
  missionTemplates,
  missions,
  notificationSettings,
  notifications,
  participantLocations,
  participants,
  photoLikes,
  photos,
  remindLogs,
  socialAccounts,
  inquiries,
  userTermAgreements,
  users,
} from '../../src/database/schema';
import type { DrizzleDB } from '../../src/database/database.module';
import { SEEDS } from './fixtures';

const CHUNK = 500;

async function deleteByIds(
  db: DrizzleDB,
  table: { id: { name: string } },
  ids: string[],
  label: string,
  log: (msg: string) => void,
): Promise<number> {
  if (ids.length === 0) return 0;
  let total = 0;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const chunk = ids.slice(i, i + CHUNK);
    const result = await db.delete(table).where(inArray(table.id, chunk));
    total += result.rowCount ?? chunk.length;
  }
  log(`✓ ${label}: ${ids.length}건 대상 삭제`);
  return total;
}

export async function purgeFixtureSeed(db: DrizzleDB, log: (msg: string) => void): Promise<void> {
  // FK 자식 → 부모 순서
  await deleteByIds(db, dateVoteResponses, SEEDS.dateVoteResponses.map((r) => r.id), 'date_vote_responses', log);
  await deleteByIds(db, dateVoteSlots, SEEDS.dateVoteSlots.map((r) => r.id), 'date_vote_slots', log);
  await deleteByIds(db, dateVotePolls, SEEDS.dateVotePolls.map((r) => r.id), 'date_vote_polls', log);
  await deleteByIds(db, photoLikes, SEEDS.photoLikes.map((r) => r.id), 'photo_likes', log);
  await deleteByIds(db, feedbackLikes, SEEDS.feedbackLikes.map((r) => r.id), 'feedback_likes', log);
  await deleteByIds(db, feedbacks, SEEDS.feedbacks.map((r) => r.id), 'feedbacks', log);
  await deleteByIds(db, photos, SEEDS.photos.map((r) => r.id), 'photos', log);
  await deleteByIds(db, missionAssignments, SEEDS.missionAssignments.map((r) => r.id), 'mission_assignments', log);
  await deleteByIds(db, missions, SEEDS.missions.map((r) => r.id), 'missions', log);
  await deleteByIds(db, participantLocations, SEEDS.participantLocations.map((r) => r.id), 'participant_locations', log);
  await deleteByIds(db, remindLogs, SEEDS.remindLogs.map((r) => r.id), 'remind_logs', log);
  await deleteByIds(db, aiImageJobs, SEEDS.aiImageJobs.map((r) => r.id), 'ai_image_jobs', log);
  await deleteByIds(db, invitationLinkEvents, SEEDS.invitationLinkEvents.map((r) => r.id), 'invitation_link_events', log);
  await deleteByIds(db, invitationSendLogs, SEEDS.sendLogs.map((r) => r.id), 'invitation_send_logs', log);
  await deleteByIds(db, participants, SEEDS.participants.map((r) => r.id), 'participants', log);
  await deleteByIds(db, eventLocations, SEEDS.eventLocations.map((r) => r.id), 'event_locations', log);
  await deleteByIds(db, invitationBlocklists, SEEDS.blocklists.map((r) => r.id), 'invitation_blocklists', log);
  await deleteByIds(db, notifications, SEEDS.notifications.map((r) => r.id), 'notifications', log);
  await deleteByIds(db, invitations, SEEDS.invitations.map((r) => r.id), 'invitations', log);
  await deleteByIds(db, inquiries, SEEDS.inquiries.map((r) => r.id), 'inquiries', log);
  await deleteByIds(db, userTermAgreements, SEEDS.userTermAgreements.map((r) => r.id), 'user_term_agreements (fixture)', log);
  await deleteByIds(db, faqItems, SEEDS.faqItems.map((r) => r.id), 'faq_items', log);
  await deleteByIds(db, socialAccounts, SEEDS.socialAccounts.map((r) => r.id), 'social_accounts', log);
  await deleteByIds(db, notificationSettings, SEEDS.notificationSettings.map((r) => r.id), 'notification_settings', log);
  await deleteByIds(db, missionTemplates, SEEDS.missionTemplates.map((r) => r.id), 'mission_templates', log);

  const seedUserIds = SEEDS.users.map((u) => u.id);
  if (seedUserIds.length > 0) {
    for (let i = 0; i < seedUserIds.length; i += CHUNK) {
      const chunk = seedUserIds.slice(i, i + CHUNK);
      await db.delete(users).where(inArray(users.id, chunk));
    }
    log(`✓ users (fixture id): ${seedUserIds.length}건 삭제`);
  }

  const orphanSeedUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(like(users.email, '%@wara.dev'));
  if (orphanSeedUsers.length > 0) {
    const orphanIds = orphanSeedUsers.map((u) => u.id);
    for (let i = 0; i < orphanIds.length; i += CHUNK) {
      const chunk = orphanIds.slice(i, i + CHUNK);
      await db.delete(users).where(inArray(users.id, chunk));
    }
    log(`✓ users (@wara.dev): ${orphanIds.length}건 삭제`);
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');

  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });
  const log = (msg: string) => process.stdout.write(`[purge-fixture] ${msg}\n`);

  log('fixtures 시드 데이터 삭제 시작...');
  log('※ service_terms / invitation_templates 는 유지 (essential 시드 upsert로 갱신)');

  await purgeFixtureSeed(db, log);

  log('완료');
  await client.end();
}

main().catch((err: unknown) => {
  const e = err as { message?: string };
  process.stderr.write(`[purge-fixture] 오류: ${e.message ?? String(err)}\n`);
  process.exit(1);
});
