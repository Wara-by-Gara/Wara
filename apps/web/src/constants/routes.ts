export const ROUTES = {
  HOME: "/",
  MEETINGS: "/meetings",
  EXPLORE: "/explore",
  /** @deprecated MEETINGS 사용 */
  CALENDAR: "/meetings",
  FRIENDS: {
    LIST: "/friends",
    DETAIL: (id: string) => `/friends/${id}`,
    HIDDEN: "/friends/hidden",
  },
  CHAT: {
    ROOM: (id: string) => `/chats/${id}`,
  },
  SIGNUP: "/signup",
  LOGIN: "/login",
  INVITATIONS: {
    LIST: "/invitations",
    CREATE: "/invitations/create",
    DETAIL: (id: string) => `/invitations/${id}`,
    EDIT: (id: string) => `/invitations/${id}/edit`,
    PARTICIPANTS: (id: string) => `/invitations/${id}/participants`,
    COMMENTS: (id: string) => `/invitations/${id}/comments`,
    LOCATION: (id: string) => `/invitations/${id}/location`,
    VOTE: (id: string) => `/invitations/${id}/vote`,
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
    SETTINGS: "/profile/settings",
    ACCOUNT: "/profile/account",
  },
  PHOTOS: {
    MAP: "/photos/map",
  },
  ADMIN: {
    DASHBOARD: '/admin',
    INQUIRIES: '/admin/inquiries',
    INQUIRY_DETAIL: (id: string) => `/admin/inquiries/${id}`,
    FAQ: '/admin/faq',
  },
  INQUIRIES: {
    HOME: "/inquiries",
    WRITE: "/inquiries/write",
    LIST: "/inquiries/list",
    ME: "/inquiries/me",
    DETAIL: (id: string) => `/inquiries/${id}`,
  },
  TERMS: {
    AGREE: "/terms/agree",
    SERVICE: "/terms/service",
    PRIVACY: "/terms/privacy",
    LOCATION: "/terms/location",
  },
} as const;
