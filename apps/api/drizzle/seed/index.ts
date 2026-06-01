import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../../src/database/schema';
import { seedTier0 } from './tier0-users';
import { seedTier1 } from './tier1-user-deps';
import { seedTier2 } from './tier2-invitations';
import { seedTier3 } from './tier3-invitation-deps';
import { seedTier4 } from './tier4-activity';
import { seedTier5 } from './tier5-engagement';
import { SEEDS } from './fixtures';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');

  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });

  const log = (msg: string) => process.stdout.write(`[seed] ${msg}\n`);

  log('시드 시작...');
  log(`users: ${SEEDS.users.length}건, templates: ${SEEDS.templates.length}건`);

  await seedTier0(db);
  log(`✓ Tier 0 — service_terms: ${SEEDS.terms.length}건, users, invitation_templates`);

  await seedTier1(db);
  log(`✓ Tier 1 — social_accounts, notification_settings, inquiries: ${SEEDS.inquiries.length}건`);

  await seedTier2(db);
  log(`✓ Tier 2 — invitations: ${SEEDS.invitations.length}건`);

  await seedTier3(db);
  log(`✓ Tier 3 — participants: ${SEEDS.participants.length}건, event_locations: ${SEEDS.eventLocations.length}건`);
  log(`           send_logs: ${SEEDS.sendLogs.length}건, link_events: ${SEEDS.invitationLinkEvents.length}건, blocklists: ${SEEDS.blocklists.length}건, notifications: ${SEEDS.notifications.length}건`);

  await seedTier4(db);
  log(`✓ Tier 4 — participant_locations: ${SEEDS.participantLocations.length}건, missions: ${SEEDS.missions.length}건, mission_assignments: ${SEEDS.missionAssignments.length}건, photos: ${SEEDS.photos.length}건`);

  await seedTier5(db);
  log(`✓ Tier 5 — photo_likes: ${SEEDS.photoLikes.length}건, feedbacks: ${SEEDS.feedbacks.length}건, feedback_likes: ${SEEDS.feedbackLikes.length}건`);

  log('시드 완료!');
  await client.end();
}

main().catch((err: Error) => {
  process.stderr.write(`[seed] 오류: ${err.message}\n`);
  process.exit(1);
});
