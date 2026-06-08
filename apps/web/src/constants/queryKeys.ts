export const QUERY_KEYS = {
  invitations: {
    all: () => ["invitations"] as const,
    myList: () => ["my-invitations"] as const,
    detail: (id: string) => ["invitations", id] as const,
    participants: (id: string) => ["invitations", id, "participants"] as const,
    myParticipant: (id: string) => ["invitations", id, "participants", "me"] as const,
    missions: (id: string) => ["invitations", id, "missions"] as const,
    photos: (id: string) => ["invitations", id, "photos"] as const,
    photoBest9: (id: string) => ["invitations", id, "photos", "best9"] as const,
    feedbacks: (id: string) => ["invitations", id, "feedbacks"] as const,
    location: (id: string) => ["invitations", id, "location"] as const,
    participantLocations: (id: string) => ["invitations", id, "participantLocations"] as const,
    vote: (id: string) => ["invitations", id, "vote"] as const,
    voteResults: (id: string) => ["invitations", id, "vote", "results"] as const,
    weather: (id: string) => ["invitations", id, "weather"] as const,
    explore: (category?: string) =>
      category ? (["invitations", "explore", category] as const) : (["invitations", "explore"] as const),
  },
  notifications: {
    all: () => ["notifications"] as const,
    list: () => ["notifications", "list"] as const,
    unread: () => ["notifications", "unread"] as const,
    settings: () => ["notifications", "settings"] as const,
  },
  users: {
    me: () => ["users", "me"] as const,
    socials: () => ["users", "socials"] as const,
  },
  friends: {
    all: () => ["friends"] as const,
    list: () => ["friends", "list"] as const,
    detail: (id: string) => ["friends", id] as const,
  },
  conversations: {
    all: () => ["conversations"] as const,
    list: () => ["conversations", "list"] as const,
    messages: (id: string) => ["conversations", id, "messages"] as const,
  },
  templates: {
    all: () => ["templates"] as const,
    detail: (id: string) => ["templates", id] as const,
  },
  faq: {
    active: () => ["faq", "active"] as const,
    adminAll: () => ["faq", "admin"] as const,
  },
  inquiries: {
    myList: () => ["inquiries", "me"] as const,
    publicList: () => ["inquiries", "public"] as const,
    detail: (id: string) => ["inquiries", id] as const,
    adminList: () => ["inquiries", "admin"] as const,
    adminDetail: (id: string) => ["inquiries", "admin", id] as const,
  },
  terms: {
    all: () => ["terms"] as const,
    agreements: () => ["terms", "agreements"] as const,
  },
} as const;
