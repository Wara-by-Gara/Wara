export const QUERY_KEYS = {
  invitations: {
    all: () => ["invitations"] as const,
    detail: (id: string) => ["invitations", id] as const,
    participants: (id: string) => ["invitations", id, "participants"] as const,
    missions: (id: string) => ["invitations", id, "missions"] as const,
    photos: (id: string) => ["invitations", id, "photos"] as const,
    photoBest9: (id: string) => ["invitations", id, "photos", "best9"] as const,
    feedbacks: (id: string) => ["invitations", id, "feedbacks"] as const,
    location: (id: string) => ["invitations", id, "location"] as const,
  },
  notifications: {
    all: () => ["notifications"] as const,
    unread: () => ["notifications", "unread"] as const,
    settings: () => ["notifications", "settings"] as const,
  },
  users: {
    me: () => ["users", "me"] as const,
  },
  templates: {
    all: () => ["templates"] as const,
    detail: (id: string) => ["templates", id] as const,
  },
} as const;
