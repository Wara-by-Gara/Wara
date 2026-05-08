import { relations } from 'drizzle-orm';
import { users, socialAccounts } from './users';
import {
  invitations,
  invitationTemplates,
  participants,
  invitationSendLogs,
} from './invitations';
import { eventLocations, participantLocations } from './locations';
import { photos, photoLikes } from './photos';
import { missions } from './missions';
import { feedbacks, feedbackLikes } from './feedbacks';
import { notifications, notificationSettings } from './notifications';

export const usersRelations = relations(users, ({ many, one }) => ({
  socialAccounts: many(socialAccounts),
  invitations: many(invitations),
  participants: many(participants),
  notifications: many(notifications),
  notificationSetting: one(notificationSettings, {
    fields: [users.id],
    references: [notificationSettings.userId],
  }),
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
  mission: one(missions, { fields: [photos.missionId], references: [missions.id] }),
  feedbacks: many(feedbacks),
  likes: many(photoLikes),
}));

export const feedbacksRelations = relations(feedbacks, ({ one, many }) => ({
  participant: one(participants, { fields: [feedbacks.participantId], references: [participants.id] }),
  invitation: one(invitations, { fields: [feedbacks.invitationId], references: [invitations.id] }),
  photo: one(photos, { fields: [feedbacks.photoId], references: [photos.id] }),
  parent: one(feedbacks, { fields: [feedbacks.parentId], references: [feedbacks.id], relationName: 'replies' }),
  replies: many(feedbacks, { relationName: 'replies' }),
  likes: many(feedbackLikes),
}));

export const missionsRelations = relations(missions, ({ one, many }) => ({
  invitation: one(invitations, { fields: [missions.invitationId], references: [invitations.id] }),
  participant: one(participants, { fields: [missions.participantId], references: [participants.id] }),
  photos: many(photos),
}));
