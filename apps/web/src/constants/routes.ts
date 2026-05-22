export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  INVITATIONS: {
    LIST: "/invitations",
    CREATE: "/invitations/create",
    DETAIL: (id: string) => `/invitations/${id}`,
    EDIT: (id: string) => `/invitations/${id}/edit`,
    PARTICIPANTS: (id: string) => `/invitations/${id}/participants`,
    MISSIONS: (id: string) => `/invitations/${id}/missions`,
    MISSION_DETAIL: (id: string, missionId: string) => `/invitations/${id}/missions/${missionId}`,
    PHOTOS: (id: string) => `/invitations/${id}/photos`,
    PHOTO_DETAIL: (id: string, photoId: string) => `/invitations/${id}/photos/${photoId}`,
    PHOTOS_BEST9: (id: string) => `/invitations/${id}/photos/best9`,
    FEEDBACKS: (id: string) => `/invitations/${id}/feedbacks`,
    LOCATION: (id: string) => `/invitations/${id}/location`,
    SETTINGS: (id: string) => `/invitations/${id}/settings`,
  },
  PUBLIC: {
    INVITATION: (id: string) => `/i/${id}`,
  },
  NOTIFICATIONS: {
    LIST: "/notifications",
    SETTINGS: "/notifications/settings",
  },
  PROFILE: {
    ME: "/profile",
    EDIT: "/profile/edit",
  },
} as const;
