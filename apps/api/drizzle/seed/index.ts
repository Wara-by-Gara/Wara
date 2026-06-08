import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { writeFileSync } from 'fs';
import path from 'path';
import { sign } from 'jsonwebtoken';
import * as schema from '../../src/database/schema';
import { seedTier0 } from './tier0-users';
import { seedTier1 } from './tier1-user-deps';
import { seedTier2 } from './tier2-invitations';
import { seedTier3 } from './tier3-invitation-deps';
import { seedTier4 } from './tier4-activity';
import { seedTier5 } from './tier5-engagement';
import { seedTier6 } from './tier6-extras';
import { SEEDS } from './fixtures';
import { loadLegalSeeds } from './legal-loader';

const TOKEN_USER_PICK = 50;
const TOKEN_EXPIRES_DAYS = 7;

function writeSeedTokens(log: (msg: string) => void): void {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    log('⚠️  JWT_ACCESS_SECRET 없음 → seed-tokens.json 생성 건너뜀');
    return;
  }

  const hosts = SEEDS.users.filter((u) => u.email?.startsWith('host')).slice(0, TOKEN_USER_PICK);
  const guests = SEEDS.users.filter((u) => u.email?.startsWith('guest')).slice(0, TOKEN_USER_PICK);

  // userId → invitationId[] (k6 시나리오에서 "내가 참여한 초대장" lookup용)
  const invitationIdsByUser = new Map<string, string[]>();
  for (const p of SEEDS.participants) {
    const list = invitationIdsByUser.get(p.userId);
    if (list) list.push(p.invitationId);
    else invitationIdsByUser.set(p.userId, [p.invitationId]);
  }

  const issue = (userId: string, role: string) =>
    sign({ id: userId, role, scope: [] }, secret, { expiresIn: `${TOKEN_EXPIRES_DAYS}d` });

  const pack = (u: typeof hosts[number]) => ({
    id: u.id,
    email: u.email,
    token: issue(u.id, u.role),
    invitationIds: invitationIdsByUser.get(u.id) ?? [],
  });

  const tokens = {
    generatedAt: new Date().toISOString(),
    expiresInDays: TOKEN_EXPIRES_DAYS,
    hosts: hosts.map(pack),
    guests: guests.map(pack),
  };

  const out = path.resolve(__dirname, 'seed-tokens.json');
  writeFileSync(out, JSON.stringify(tokens, null, 2), 'utf8');
  log(`✓ seed-tokens.json — hosts ${hosts.length}, guests ${guests.length} (${TOKEN_EXPIRES_DAYS}일 만료)`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.');

  const client = postgres(url);
  const db = drizzle(client, { schema, casing: 'snake_case' });

  const log = (msg: string) => process.stdout.write(`[seed] ${msg}\n`);

  log('시드 시작...');
  log(`users: ${SEEDS.users.length}건, templates: ${SEEDS.templates.length}건`);

  await seedTier0(db);
  log(`✓ Tier 0 — service_terms: ${loadLegalSeeds().length}건 (docs/legal/*.md), users, invitation_templates`);

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

  await seedTier6(db);
  log(`✓ Tier 6 — faq_items: ${SEEDS.faqItems.length}건, user_term_agreements: ${SEEDS.userTermAgreements.length}건, remind_logs: ${SEEDS.remindLogs.length}건, ai_image_jobs: ${SEEDS.aiImageJobs.length}건`);
  log(`           date_vote_polls: ${SEEDS.dateVotePolls.length}건, date_vote_slots: ${SEEDS.dateVoteSlots.length}건, date_vote_responses: ${SEEDS.dateVoteResponses.length}건`);

  writeSeedTokens(log);

  log('시드 완료!');
  await client.end();
}

main().catch((err: Error) => {
  process.stderr.write(`[seed] 오류: ${err.message}\n`);
  process.exit(1);
});
