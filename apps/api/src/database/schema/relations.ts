import { relations } from 'drizzle-orm';
import { users, socialAccounts } from './users';
import { serviceTerms, userTermAgreements } from './terms';
import {
  invitations,
  invitationTemplates,
  participants,
  invitationSendLogs,
  invitationLinkEvents,
  invitationBlocklists,
} from './invitations';
import { aiImageJobs } from './ai-image-jobs';
import { eventLocations, participantLocations } from './locations';
import { photos, photoLikes } from './photos';
import { missions, missionAssignments } from './missions';
import { feedbacks, feedbackLikes } from './feedbacks';
import { notifications, notificationSettings, remindLogs } from './notifications';

export const usersRelations = relations(users, ({ many, one }) => ({
  socialAccounts: many(socialAccounts),
  invitations: many(invitations),
  participants: many(participants),
  notifications: many(notifications, { relationName: 'receiver' }),
  sentNotifications: many(notifications, { relationName: 'actor' }),
  notificationSetting: one(notificationSettings, {
    fields: [users.id],
    references: [notificationSettings.userId],
  }),
  termAgreements: many(userTermAgreements),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one }) => ({
  user: one(users, { fields: [socialAccounts.userId], references: [users.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one, many }) => ({
  host: one(users, { fields: [invitations.userId], references: [users.id] }),
  template: one(invitationTemplates, { fields: [invitations.templateId], references: [invitationTemplates.id] }),
  eventLocation: one(eventLocations, { fields: [invitations.id], references: [eventLocations.invitationId] }),
  participants: many(participants),
  photos: many(photos),
  feedbacks: many(feedbacks),
  missions: many(missions),
  sendLogs: many(invitationSendLogs),
  participantLocations: many(participantLocations),
  blocklists: many(invitationBlocklists),
  aiImageJobs: many(aiImageJobs),
}));

export const invitationBlocklistsRelations = relations(invitationBlocklists, ({ one }) => ({
  invitation: one(invitations, { fields: [invitationBlocklists.invitationId], references: [invitations.id] }),
  blockedUser: one(users, { fields: [invitationBlocklists.blockedUserId], references: [users.id], relationName: 'blockedUser' }),
  blockedBy: one(users, { fields: [invitationBlocklists.blockedByUserId], references: [users.id], relationName: 'blockedBy' }),
}));

export const participantsRelations = relations(participants, ({ one, many }) => ({
  user: one(users, { fields: [participants.userId], references: [users.id] }),
  invitation: one(invitations, { fields: [participants.invitationId], references: [invitations.id] }),
  photos: many(photos),
  feedbacks: many(feedbacks),
  photoLikes: many(photoLikes),
  feedbackLikes: many(feedbackLikes),
  missions: many(missions),
  locations: many(participantLocations),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  participant: one(participants, { fields: [photos.participantId], references: [participants.id] }),
  invitation: one(invitations, { fields: [photos.invitationId], references: [invitations.id] }),
  feedbacks: many(feedbacks, { relationName: 'feedbacks' }),
  attachedFeedbacks: many(feedbacks, { relationName: 'attachedFeedbacks' }),
  likes: many(photoLikes),
}));

export const feedbacksRelations = relations(feedbacks, ({ one, many }) => ({
  participant: one(participants, { fields: [feedbacks.participantId], references: [participants.id] }),
  invitation: one(invitations, { fields: [feedbacks.invitationId], references: [invitations.id] }),
  photo: one(photos, { fields: [feedbacks.photoId], references: [photos.id], relationName: 'feedbacks' }),
  attachedPhoto: one(photos, { fields: [feedbacks.attachedPhotoId], references: [photos.id], relationName: 'attachedFeedbacks' }),
  parent: one(feedbacks, { fields: [feedbacks.parentId], references: [feedbacks.id], relationName: 'replies' }),
  replies: many(feedbacks, { relationName: 'replies' }),
  likes: many(feedbackLikes),
}));

export const missionsRelations = relations(missions, ({ one, many }) => ({
  invitation: one(invitations, { fields: [missions.invitationId], references: [invitations.id] }),
  participant: one(participants, { fields: [missions.participantId], references: [participants.id] }),
  photos: many(photos),
  assignments: many(missionAssignments),
}));

export const missionAssignmentsRelations = relations(missionAssignments, ({ one }) => ({
  mission: one(missions, { fields: [missionAssignments.missionId], references: [missions.id] }),
  participant: one(participants, { fields: [missionAssignments.participantId], references: [participants.id] }),
}));

export const invitationSendLogsRelations = relations(invitationSendLogs, ({ one, many }) => ({
  invitation: one(invitations, { fields: [invitationSendLogs.invitationId], references: [invitations.id] }),
  sender: one(users, { fields: [invitationSendLogs.senderId], references: [users.id] }),
  linkEvents: many(invitationLinkEvents),
}));

export const invitationLinkEventsRelations = relations(invitationLinkEvents, ({ one }) => ({
  log: one(invitationSendLogs, { fields: [invitationLinkEvents.logId], references: [invitationSendLogs.id] }),
  user: one(users, { fields: [invitationLinkEvents.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  receiver: one(users, { fields: [notifications.userId], references: [users.id], relationName: 'receiver' }),
  actor: one(users, { fields: [notifications.actorUserId], references: [users.id], relationName: 'actor' }),
}));

export const remindLogsRelations = relations(remindLogs, ({ one }) => ({
  invitation: one(invitations, { fields: [remindLogs.invitationId], references: [invitations.id] }),
}));

export const aiImageJobsRelations = relations(aiImageJobs, ({ one }) => ({
  user: one(users, { fields: [aiImageJobs.userId], references: [users.id] }),
  invitation: one(invitations, { fields: [aiImageJobs.invitationId], references: [invitations.id] }),
}));

export const serviceTermsRelations = relations(serviceTerms, ({ many, one }) => ({
  agreements: many(userTermAgreements),
  creator: one(users, { fields: [serviceTerms.createdBy], references: [users.id] }),
}));

export const userTermAgreementsRelations = relations(userTermAgreements, ({ one }) => ({
  term: one(serviceTerms, { fields: [userTermAgreements.termId], references: [serviceTerms.id] }),
  user: one(users, { fields: [userTermAgreements.userId], references: [users.id] }),
}));
