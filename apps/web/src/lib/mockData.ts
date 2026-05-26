/**
 * Wara 페이지/스토리북에서 공유하는 mock fixture.
 * 실제 API 응답을 흉내내며 V1.0 시나리오를 cover.
 */

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
  host: { name: "김와라", avatarUrl: "https://i.pravatar.cc/80?img=18", handle: "@wara_kim" },
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
  { id: "p1", name: "김와라", avatarUrl: "https://i.pravatar.cc/80?img=18", status: "attending", isHost: true },
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

/** 로그인 사용자 프로필 사진 (Storybook·마이페이지·홈 헤더) */
export const mockMeAvatarUrl = "/profile-me.png";

export interface MockCommentReply {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  variant?: "default" | "mine" | "host";
  replyToName?: string;
}

export interface MockComment {
  id: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  variant?: "default" | "mine" | "host" | "deleted" | "reported";
  replies?: MockCommentReply[];
}

export const mockComments: MockComment[] = [
  {
    id: "c1",
    authorName: "박미라",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=21",
    content: "기대돼요! 곧 봬요 ✨",
    createdAt: "3분 전",
    replies: [
      {
        id: "c1-r1",
        authorName: "이지은",
        authorAvatarUrl: "https://i.pravatar.cc/80?img=24",
        replyToName: "박미라",
        content: "저도 너무 기대돼요!",
        createdAt: "2분 전",
      },
      {
        id: "c1-r2",
        authorName: "김와라",
        authorAvatarUrl: mockMeAvatarUrl,
        replyToName: "박미라",
        content: "곧 봬요 💕",
        createdAt: "1분 전",
        variant: "host",
      },
    ],
  },
  { id: "c2", authorName: "이지은", authorAvatarUrl: "https://i.pravatar.cc/80?img=24", content: "선물 가져갈게요!", createdAt: "12분 전" },
  { id: "c3", authorName: "김와라", authorAvatarUrl: "https://i.pravatar.cc/80?img=18", content: "다들 와주셔서 감사해요 ❤️", createdAt: "1시간 전", variant: "host" },
  {
    id: "c4",
    authorName: "최하나",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=44",
    content: "주차장 위치 알려주실 수 있나요?",
    createdAt: "2시간 전",
    replies: [
      {
        id: "c4-r1",
        authorName: "김와라",
        authorAvatarUrl: mockMeAvatarUrl,
        replyToName: "최하나",
        content: "건물 지하 1층 무료 주차 가능해요. 만차면 인근 공영주차장 이용해주세요!",
        createdAt: "1시간 전",
        variant: "host",
      },
      {
        id: "c4-r2",
        authorName: "최하나",
        authorAvatarUrl: "https://i.pravatar.cc/80?img=44",
        replyToName: "김와라",
        content: "알려주셔서 감사해요!",
        createdAt: "45분 전",
      },
      {
        id: "c4-r3",
        authorName: "박미라",
        authorAvatarUrl: "https://i.pravatar.cc/80?img=21",
        replyToName: "김와라",
        content: "저도 그쪽으로 갈게요~",
        createdAt: "30분 전",
      },
    ],
  },
  { id: "c5", authorName: "정민지", authorAvatarUrl: "https://i.pravatar.cc/80?img=49", content: "친구 한 명 더 데려가도 될까요?", createdAt: "어제" },
  { id: "c6", authorName: "이상민", authorAvatarUrl: "https://i.pravatar.cc/80?img=51", content: "케이크 너무 기대돼요 🎂", createdAt: "어제" },
  { id: "c7", authorName: "윤지호", authorAvatarUrl: "https://i.pravatar.cc/80?img=53", content: "조금 늦을 수도 있어요!", createdAt: "2일 전" },
  { id: "c8", authorName: "강수연", authorAvatarUrl: "https://i.pravatar.cc/80?img=56", content: "선물 포장 완료했어요", createdAt: "2일 전" },
  { id: "c9", authorName: "오현우", authorAvatarUrl: "https://i.pravatar.cc/80?img=60", content: "사진 많이 찍어주세요 📸", createdAt: "3일 전" },
  { id: "c10", authorName: "한지수", authorAvatarUrl: "https://i.pravatar.cc/80?img=62", content: "너무 설레요, 곧 봐요!", createdAt: "3일 전" },
  { id: "c11", authorName: "송태형", authorAvatarUrl: "https://i.pravatar.cc/80?img=65", content: "드레스코드 있나요?", createdAt: "4일 전" },
  { id: "c12", authorName: "전유진", authorAvatarUrl: "https://i.pravatar.cc/80?img=68", content: "케이크 기대 중이에요 🎂", createdAt: "4일 전" },
  { id: "c13", authorName: "박미라", authorAvatarUrl: "https://i.pravatar.cc/80?img=21", content: "카메라 챙겨갈게요!", createdAt: "5일 전" },
  { id: "c14", authorName: "이지은", authorAvatarUrl: "https://i.pravatar.cc/80?img=24", content: "같이 가는 친구도 데려도 될까요?", createdAt: "5일 전" },
  { id: "c15", authorName: "최하나", authorAvatarUrl: "https://i.pravatar.cc/80?img=44", content: "너무 기대돼요 ✨", createdAt: "6일 전" },
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
  nickname: string;
  avatarUrl?: string;
  socialProvider?: "kakao" | "naver" | "apple";
  stats?: { created: number; joined: number };
}

export const mockMe: MockUser = {
  id: "u_me",
  nickname: "김와라",
  avatarUrl: mockMeAvatarUrl,
  socialProvider: "kakao",
  stats: { created: 4, joined: 12 },
};
