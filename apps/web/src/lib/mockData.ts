/**
 * Wara 페이지/스토리북에서 공유하는 mock fixture.
 * 실제 API 응답을 흉내내며 V1.0 시나리오를 cover.
 */

/** 로그인 사용자 프로필 사진 (Storybook·마이페이지·홈 헤더) */
export const mockMeAvatarUrl = "/profile-me.png";

export interface MockInvitation {
  id: string;
  title: string;
  description: string;
  date: string;
  /** 일시 카드용 시각 (예: 오후 7시) */
  time?: string;
  /** 일시 카드용 예상 소요 (예: 2시간 예정) */
  duration?: string;
  location: string;
  address?: string;
  coverImageUrl?: string;
  ddayLabel?: string;
  host: { name: string; avatarUrl?: string; handle?: string };
  rsvp?: { current: number; capacity?: number };
  isHost?: boolean;
  isPrivate?: boolean;
  status?: "draft" | "published" | "ended" | "closed";
}

export const mockInvitation: MockInvitation = {
  id: "inv_01HZX",
  title: "와라의 생일 파티",
  description: "함께 모여서 즐겁게 시간 보내요. 가벼운 음식과 음료가\n준비되어 있어요.",
  date: "2026년 5월 19일 화요일",
  time: "오후 7시",
  location: "전주 한옥마을",
  address: "전북 전주시 완산구 기린대로 99",
  coverImageUrl: "/invitation-cover-cake.png",
  ddayLabel: "D-3",
  host: { name: "김와라", avatarUrl: mockMeAvatarUrl, handle: "@wara_kim" },
  rsvp: { current: 12, capacity: 20 },
  status: "published",
};

export const mockInvitationDraft: MockInvitation = {
  ...mockInvitation,
  id: "inv_draft01",
  title: "(작성 중인 초대장)",
  status: "draft",
  coverImageUrl: undefined,
  ddayLabel: undefined,
};

export interface MockParticipant {
  id: string;
  name: string;
  avatarUrl?: string;
  status: "attending" | "maybe" | "declined" | "noResponse";
  isHost?: boolean;
  companionCount?: number;
  requestPreview?: string;
  memo?: string;
}

export const mockParticipants: MockParticipant[] = [
  { id: "p1", name: "김와라", avatarUrl: mockMeAvatarUrl, status: "attending", isHost: true },
  { id: "p2", name: "박미라", avatarUrl: "https://i.pravatar.cc/80?img=21", status: "attending", companionCount: 1, requestPreview: "참석 가능하지만 조금 늦을수도 있어요" },
  { id: "p3", name: "이지은", avatarUrl: "https://i.pravatar.cc/80?img=24", status: "attending" },
  { id: "p4", name: "최하나", avatarUrl: "https://i.pravatar.cc/80?img=44", status: "attending" },
  { id: "p5", name: "정민지", avatarUrl: "https://i.pravatar.cc/80?img=49", status: "attending", companionCount: 2 },
  { id: "p6", name: "이상민", avatarUrl: "https://i.pravatar.cc/80?img=51", status: "attending" },
  { id: "p7", name: "윤지호", avatarUrl: "https://i.pravatar.cc/80?img=53", status: "attending", memo: "비건 / 알러지: 견과류" },
  { id: "p8", name: "강수연", avatarUrl: "https://i.pravatar.cc/80?img=56", status: "attending" },
  { id: "p9", name: "오현우", avatarUrl: "https://i.pravatar.cc/80?img=60", status: "maybe", requestPreview: "회사 일정 보고 다시 알려드릴게요" },
  { id: "p10", name: "한지수", avatarUrl: "https://i.pravatar.cc/80?img=62", status: "maybe" },
  { id: "p11", name: "송태형", avatarUrl: "https://i.pravatar.cc/80?img=65", status: "declined" },
  { id: "p12", name: "전유진", avatarUrl: "https://i.pravatar.cc/80?img=68", status: "noResponse" },
];

export interface MockCommentReply {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  variant?: "default" | "mine" | "host";
  replyToName?: string;
  likeCount?: number;
}

export interface MockComment {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  variant?: "default" | "mine" | "host" | "deleted" | "reported";
  replies?: MockCommentReply[];
  likeCount?: number;
}

export const mockComments: MockComment[] = [
  {
    id: "c1",
    authorName: "박미라",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=21",
    content: "기대돼요! 곧 봬요 ✨",
    createdAt: "3분 전",
    likeCount: 12,
    replies: [
      {
        id: "c1-r1",
        authorName: "이지은",
        authorAvatarUrl: "https://i.pravatar.cc/80?img=24",
        replyToName: "박미라",
        content: "저도 너무 기대돼요!",
        createdAt: "2분 전",
        likeCount: 4,
      },
      {
        id: "c1-r2",
        authorName: "김와라",
        authorAvatarUrl: mockMeAvatarUrl,
        replyToName: "박미라",
        content: "곧 봬요 💕",
        createdAt: "1분 전",
        variant: "host",
        likeCount: 7,
      },
    ],
  },
  { id: "c2", authorName: "이지은", authorAvatarUrl: "https://i.pravatar.cc/80?img=24", content: "선물 가져갈게요!", createdAt: "12분 전", likeCount: 6 },
  { id: "c3", authorName: "김와라", authorAvatarUrl: mockMeAvatarUrl, content: "다들 와주셔서 감사해요 ❤️", createdAt: "1시간 전", variant: "host", likeCount: 24 },
  {
    id: "c4",
    authorName: "최하나",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=44",
    content: "주차장 위치 알려주실 수 있나요?",
    createdAt: "2시간 전",
    likeCount: 3,
    replies: [
      {
        id: "c4-r1",
        authorName: "김와라",
        authorAvatarUrl: mockMeAvatarUrl,
        replyToName: "최하나",
        content: "건물 지하 1층 무료 주차 가능해요. 만차면 인근 공영주차장 이용해주세요!",
        createdAt: "1시간 전",
        variant: "host",
        likeCount: 11,
      },
      {
        id: "c4-r2",
        authorName: "최하나",
        authorAvatarUrl: "https://i.pravatar.cc/80?img=44",
        replyToName: "김와라",
        content: "알려주셔서 감사해요!",
        createdAt: "45분 전",
        likeCount: 2,
      },
      {
        id: "c4-r3",
        authorName: "박미라",
        authorAvatarUrl: "https://i.pravatar.cc/80?img=21",
        replyToName: "김와라",
        content: "저도 그쪽으로 갈게요~",
        createdAt: "30분 전",
        likeCount: 1,
      },
    ],
  },
  { id: "c5", authorName: "정민지", authorAvatarUrl: "https://i.pravatar.cc/80?img=49", content: "친구 한 명 더 데려가도 될까요?", createdAt: "어제", likeCount: 2 },
  { id: "c6", authorName: "이상민", authorAvatarUrl: "https://i.pravatar.cc/80?img=51", content: "케이크 너무 기대돼요 🎂", createdAt: "어제", likeCount: 8 },
  { id: "c7", authorName: "윤지호", authorAvatarUrl: "https://i.pravatar.cc/80?img=53", content: "조금 늦을 수도 있어요!", createdAt: "2일 전", likeCount: 0 },
  { id: "c8", authorName: "강수연", authorAvatarUrl: "https://i.pravatar.cc/80?img=56", content: "선물 포장 완료했어요", createdAt: "2일 전", likeCount: 5 },
  { id: "c9", authorName: "오현우", authorAvatarUrl: "https://i.pravatar.cc/80?img=60", content: "사진 많이 찍어주세요 📸", createdAt: "3일 전", likeCount: 9 },
  { id: "c10", authorName: "한지수", authorAvatarUrl: "https://i.pravatar.cc/80?img=62", content: "너무 설레요, 곧 봐요!", createdAt: "3일 전", likeCount: 3 },
  { id: "c11", authorName: "송태형", authorAvatarUrl: "https://i.pravatar.cc/80?img=65", content: "드레스코드 있나요?", createdAt: "4일 전", likeCount: 1 },
  { id: "c12", authorName: "전유진", authorAvatarUrl: "https://i.pravatar.cc/80?img=68", content: "케이크 기대 중이에요 🎂", createdAt: "4일 전", likeCount: 7 },
  { id: "c13", authorName: "박미라", authorAvatarUrl: "https://i.pravatar.cc/80?img=21", content: "카메라 챙겨갈게요!", createdAt: "5일 전", likeCount: 4 },
  { id: "c14", authorName: "이지은", authorAvatarUrl: "https://i.pravatar.cc/80?img=24", content: "같이 가는 친구도 데려도 될까요?", createdAt: "5일 전", likeCount: 2 },
  { id: "c15", authorName: "최하나", authorAvatarUrl: "https://i.pravatar.cc/80?img=44", content: "너무 기대돼요 ✨", createdAt: "6일 전", likeCount: 6 },
];

/** 초대장 상세·앨범 mock용 로컬 사진 (외부 URL 차단 환경 대비) */
export const mockAlbumLocalSrcs = [
  "/album-birthday-1.jpg",
  "/album-birthday-2.jpg",
  "/album-birthday-3.jpg",
  "/album-birthday-4.jpg",
  "/album-birthday-5.jpg",
] as const;

/** 초대장 상세 앨범 미리보기 (3×2 중 앞 5칸) */
export const mockAlbumPreviewSrcs = mockAlbumLocalSrcs;

/** 08 Guest Public 앨범 미리보기 — 생일 파티 테마 */
export const mockAlbumPreviewBirthdaySrcs = mockAlbumLocalSrcs;

/** 앨범 미리보기 마지막 칸 (+N) */
export const mockAlbumPreviewOverflow = 18;

/** 앨범 뷰어 등 단일 사진 미리보기용 (그리드 타일은 src 없이 회색 프레임) */
export const albumViewerSampleSrc = "/invitation-cover-cake.png";

export const mockPhotos = Array.from({ length: 12 }, (_, i) => {
  const author = mockParticipants[i % mockParticipants.length]!;
  return {
    id: `ph${i + 1}`,
    src: mockAlbumLocalSrcs[i % mockAlbumLocalSrcs.length],
    authorName: author.name,
    authorAvatarUrl: author.avatarUrl,
    createdAt: i < 4 ? "오늘" : i < 8 ? "어제" : "이번 주",
    likeCount: [24, 18, 31, 9, 42, 15, 7, 28, 11, 35, 6, 20][i] ?? 0,
    viewCount: [120, 88, 200, 45, 310, 72, 33, 155, 60, 240, 25, 95][i] ?? 0,
    commentCount: [8, 3, 12, 1, 15, 4, 0, 9, 2, 11, 1, 5][i] ?? 0,
  };
});

/** 좋아요·조회수·댓글 수 합산 점수로 상위 9장 선정 (리마인드 앨범용) */
export const mockRemindPhotos = [...mockPhotos]
  .sort((a, b) => {
    const scoreA = a.likeCount * 3 + a.viewCount + a.commentCount * 2;
    const scoreB = b.likeCount * 3 + b.viewCount + b.commentCount * 2;
    return scoreB - scoreA;
  })
  .slice(0, 9);

export interface MockNotification {
  id: string;
  type:
    | "newRsvp"
    | "rsvpChanged"
    | "newComment"
    | "newPhoto"
    | "invitationUpdated"
    | "eventReminder"
    | "albumOpened"
    | "hostNotice";
  title: string;
  description?: string;
  time: string;
  unread?: boolean;
}

export const mockNotifications: MockNotification[] = [
  { id: "n1", type: "newRsvp", title: "박미라님이 참석한다고 했어요", time: "3분 전", unread: true },
  { id: "n2", type: "newComment", title: "새 댓글이 도착했어요", description: "기대돼요!", time: "12분 전", unread: true },
  { id: "n3", type: "newPhoto", title: "사진 3장이 올라왔어요", time: "1시간 전" },
  { id: "n4", type: "rsvpChanged", title: "오현우님이 미정으로 바꿨어요", time: "2시간 전" },
  { id: "n5", type: "eventReminder", title: "내일 모임이에요!", description: "와라의 생일 파티", time: "어제" },
  { id: "n6", type: "invitationUpdated", title: "시간이 변경되었어요", description: "19:00 → 19:30", time: "2일 전" },
  { id: "n7", type: "hostNotice", title: "호스트가 공지를 보냈어요", description: "주차장 안내가 있어요", time: "3일 전" },
];

/** 템플릿 자동 슬라이드용 로컬 이미지 */
export const mockTemplateSlides = [
  { src: "/template-slide-blue.png", alt: "BLUE 콜라주 템플릿" },
  { src: "/template-slide-retro.png", alt: "레트로 포스터 템플릿" },
  { src: "/template-slide-y2k.png", alt: "Y2K 콜라주 템플릿" },
] as const;

export interface MockTemplate {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  premium?: boolean;
}

export const mockTemplates: MockTemplate[] = [
  { id: "t1", name: "BLUE", category: "Y2K", imageUrl: mockTemplateSlides[0].src },
  { id: "t2", name: "Retro Pop", category: "Y2K", imageUrl: mockTemplateSlides[1].src },
  { id: "t3", name: "feels like Y2K", category: "Y2K", imageUrl: mockTemplateSlides[2].src },
  { id: "t4", name: "Garden Party", category: "Floral", imageUrl: "https://placehold.co/300x400/D3FBEA/171717?text=Garden" },
  { id: "t5", name: "Birthday Pop", category: "Birthday", imageUrl: "https://placehold.co/300x400/FF9ACA/171717?text=Birthday" },
  { id: "t6", name: "Premium Gold", category: "Premium", imageUrl: "https://placehold.co/300x400/FAB005/171717?text=Gold", premium: true },
  { id: "t7", name: "Simple White", category: "Minimal", imageUrl: "https://placehold.co/300x400/FAFAFA/171717?text=Simple" },
  { id: "t8", name: "Blank", category: "Blank" },
];

export interface MockUser {
  id: string;
  name?: string;
  nickname: string;
  avatarUrl?: string;
  socialProvider?: "kakao" | "naver" | "apple";
  stats?: { created: number; joined: number };
}

export const mockMe: MockUser = {
  id: "u_me",
  name: "김와라",
  nickname: "wara_kim",
  avatarUrl: mockMeAvatarUrl,
  socialProvider: "kakao",
  stats: { created: 4, joined: 12 },
};

/* ───────────────── 친구 (Friends 탭) ───────────────── */

export interface MockFriend {
  id: string;
  name: string;
  avatarUrl?: string;
  /** 함께한 모임 수 */
  sharedCount: number;
  /** 가장 최근 함께한 모임 제목 */
  lastSharedTitle: string;
  /** 최근 함께한 시점(상대 표기) */
  lastSharedAt: string;
}

/** 친구 목록 — 함께한 모임 많은 순. mockParticipants와 동일 인물/아바타 재사용 */
export const mockFriends: MockFriend[] = [
  { id: "p2", name: "박미라", avatarUrl: "https://i.pravatar.cc/80?img=21", sharedCount: 8, lastSharedTitle: "와라의 생일 파티", lastSharedAt: "2일 전" },
  { id: "p3", name: "이지은", avatarUrl: "https://i.pravatar.cc/80?img=24", sharedCount: 6, lastSharedTitle: "주말 브런치", lastSharedAt: "5일 전" },
  { id: "p4", name: "최하나", avatarUrl: "https://i.pravatar.cc/80?img=44", sharedCount: 5, lastSharedTitle: "북클럽 3월 모임", lastSharedAt: "1주 전" },
  { id: "p5", name: "정민지", avatarUrl: "https://i.pravatar.cc/80?img=49", sharedCount: 4, lastSharedTitle: "와라의 생일 파티", lastSharedAt: "2일 전" },
  { id: "p6", name: "이상민", avatarUrl: "https://i.pravatar.cc/80?img=51", sharedCount: 4, lastSharedTitle: "등산 모임", lastSharedAt: "3주 전" },
  { id: "p8", name: "강수연", avatarUrl: "https://i.pravatar.cc/80?img=56", sharedCount: 3, lastSharedTitle: "주말 브런치", lastSharedAt: "5일 전" },
  { id: "p7", name: "윤지호", avatarUrl: "https://i.pravatar.cc/80?img=53", sharedCount: 3, lastSharedTitle: "와인 한잔", lastSharedAt: "10일 전" },
  { id: "p9", name: "오현우", avatarUrl: "https://i.pravatar.cc/80?img=60", sharedCount: 2, lastSharedTitle: "북클럽 3월 모임", lastSharedAt: "1주 전" },
  { id: "p10", name: "한지수", avatarUrl: "https://i.pravatar.cc/80?img=62", sharedCount: 2, lastSharedTitle: "와라의 생일 파티", lastSharedAt: "2일 전" },
  { id: "p12", name: "전유진", avatarUrl: "https://i.pravatar.cc/80?img=68", sharedCount: 1, lastSharedTitle: "등산 모임", lastSharedAt: "3주 전" },
  { id: "p11", name: "송태형", avatarUrl: "https://i.pravatar.cc/80?img=65", sharedCount: 1, lastSharedTitle: "와인 한잔", lastSharedAt: "10일 전" },
];

/** 상단 "최근 함께한 친구" — 최근 함께한 순 상위 10명 (id 큐레이션) */
const RECENT_FRIEND_ORDER = ["p2", "p5", "p10", "p3", "p8", "p4", "p9", "p7", "p11", "p6"] as const;
export const mockRecentFriends: MockFriend[] = RECENT_FRIEND_ORDER.map((id) =>
  mockFriends.find((f) => f.id === id),
).filter((f): f is MockFriend => Boolean(f));

export interface MockFriendProfile extends MockFriend {
  /** 함께 아는 친구 */
  mutualFriends: { id: string; name: string; avatarUrl?: string }[];
  /** 함께 참여했던 초대 */
  sharedInvitations: { id: string; title: string; date: string; imageUrl?: string }[];
}

/** 친구 프로필 상세 mock — id로 친구를 찾아 공통 mutual/shared를 합성 */
export function getMockFriendProfile(id: string): MockFriendProfile {
  const friend = mockFriends.find((f) => f.id === id) ?? mockFriends[0]!;
  const mutualFriends = mockFriends
    .filter((f) => f.id !== friend.id)
    .slice(0, 5)
    .map((f) => ({ id: f.id, name: f.name, avatarUrl: f.avatarUrl }));
  const sharedInvitations = [
    { id: mockInvitation.id, title: mockInvitation.title, date: mockInvitation.date, imageUrl: mockInvitation.coverImageUrl },
    { id: "inv_brunch", title: "주말 브런치", date: "2026년 5월 25일 일요일", imageUrl: undefined },
    { id: "inv_book", title: "북클럽 3월 모임", date: "2026년 4월 12일 토요일", imageUrl: undefined },
  ];
  return { ...friend, mutualFriends, sharedInvitations };
}
