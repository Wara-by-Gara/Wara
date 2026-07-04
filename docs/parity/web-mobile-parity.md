# 웹–모바일 패리티 매트릭스

> SoT: 2026-07-04 기준 라우트 대조 (웹 41 page.tsx / 모바일 40 라우트).
> 원칙: **IA·화면 구성·플로우·카피는 통일, 시각 표현은 플랫폼 소유** (웹=@wara/ui+tokens iOS 26 리스킨, 모바일=iOS 네이티브).
> 어드민(R-NJJYOA)은 명세상 **W 전용** — 모바일 제외.

상태: ✅ 양쪽 존재 · 📱 모바일 필요(P1/P2) · 🚫 의도적 미러 제외

## 인증/온보딩 (R-REENMY, R-UBNIJA)

| 기능 | 웹 | 모바일 | 상태 | F-코드 |
|---|---|---|---|---|
| 로그인 | /login | app/login | ✅ | F-TRBWGU |
| 회원가입 | /signup | app/signup | ✅ | F-TRBWGU |
| 온보딩 | /onboarding | app/onboarding | ✅ 2026-07-04 | R-REENMY |
| 약관 동의 | /terms/agree | app/terms-agree | ✅ | F-YECRCZ |
| 약관 전문(서비스/개인정보/위치) | /terms/service·privacy·location | settings/terms/[type] | ✅ 2026-07-04 분리 완료 | F-MJUIEM |

## 초대장 (R-RWXOOV, R-FOTKSQ, R-FNIWJR)

| 기능 | 웹 | 모바일 | 상태 | F-코드 |
|---|---|---|---|---|
| 초대장 목록 | /invitations | (tabs)/invitations | ✅ | F-MPBPAP |
| 초대장 생성 | /invitations/create (단일) | invitations/create/* (마법사 5스텝) | ✅ 플로우 상이 — Phase 5 IA 대조 | F-PFLCKA |
| 초대장 상세 | /invitations/[id] | invitations/[id] | ✅ | F-PFLCKA |
| 초대장 편집 | /invitations/[id]/edit, /edit | invitations/[id]/edit | ✅ 2026-07-04 (기본정보 단일 폼 — 마법사 구조상 재사용 불가 판정) | F-PFLCKA |
| 위치/지도 | /invitations/[id]/location | invitations/[id]/map | ✅ | F-SZVDFN |
| 참가자 | /invitations/[id]/participants | invitations/[id]/participants | ✅ | F-MBOMQU |
| 댓글(활동피드) | /invitations/[id]/comments | invitations/[id]/comments | ✅ 2026-07-04 | F-DPZZXZ |
| 날짜 투표 | /invitations/[id]/vote | invitations/[id]/vote | ✅ | F-TMAXOC |
| 숨김 목록 | /invitations/hidden | invitations/hidden | ✅ 2026-07-04 | F-AWFJXB |
| 공유 진입 | /i/[id] | 딥링크(wara://) | ✅ 수단 상이 | F-UMDBGD |
| 재모임 | — | invitations/[id]/remeet | 🚫 웹 역패리티 후보 (Phase 5) | F-YWWZNF |
| AI 커버 | create 내 통합 | create/ai-cover 스텝 | ✅ 플로우 상이 | F-QYVVKC |

## 소셜/소통 (R-CTCIIZ, R-EXKDIN)

| 기능 | 웹 | 모바일 | 상태 | F-코드 |
|---|---|---|---|---|
| DM 목록 | /chats | chat | ✅ | F-UKCZZH |
| DM 대화방 | /chats/[id] | chat/[conversationId] | ✅ | F-FHPQJD |
| 친구 목록 | /friends | friends | ✅ | F-JXCVQQ |
| 친구 상세 | /friends/[id] | friends/[userId] | ✅ | F-JXCVQQ |
| 친구 숨김 | /friends/hidden | friends/hidden | ✅ 2026-07-04 | S-ROGBNG |
| 알림 | /notifications | (tabs)/notifications | ✅ | F-MZPMRW |

## 탐색/일정/사진 (R-TOMOAT, R-FNIWJR, R-GRVDJB)

| 기능 | 웹 | 모바일 | 상태 | F-코드 |
|---|---|---|---|---|
| 탐색 | /explore | explore | ✅ | F-WASSLI |
| 탐색 지도 | /explore/map | explore 내 통합 | Phase 5 IA 대조 | F-KAHNVA(M전용) |
| 캘린더 | /calendar | meetings로 커버 | 🚫 신규 불필요 (웹 /calendar는 /meetings로 redirect만 함) | R-FNIWJR |
| 모임 내역 | /meetings | meetings | ✅ 2026-07-04 (월 달력+날짜 필터 포함) | F-MPBPAP |
| 사진 지도 | /photos/map | photos/map | ✅ | S-FWRMAK |
| 사진 탭 | (초대장 내) | (tabs)/photos | Phase 5 IA 대조 | F-ONZZVH |

## 마이/설정/고객센터 (R-SCOBES, R-RMZDGD)

| 기능 | 웹 | 모바일 | 상태 | F-코드 |
|---|---|---|---|---|
| 프로필 | /profile | (tabs)/profile | ✅ | F-QERKMV |
| 프로필 편집 | /profile/edit | profile 내 | Phase 5 IA 대조 | S-HMYVDG |
| 계정 관리 | /profile/account | settings | Phase 5 IA 대조 | F-OAGNIV |
| 설정 | /profile/settings | settings | ✅ 경로 상이 | F-OAGNIV |
| 리마인드 설정 | 설정 내 | settings/reminders | ✅ | F-FUNIDM |
| 고객센터 홈 | — | support | 🚫 웹은 /inquiries 직행 | F-RRGTST |
| FAQ | (inquiries 내) | support/faq | Phase 5 IA 대조 | F-SIVXPW |
| 문의 목록/상세/작성 | /inquiries + /list + /me + /write + /[id] | support/inquiries/{index,write,[id]} | ✅ 2026-07-04 분리 완료 | F-CJCIXI, F-IOFTOP |

## 어드민 (R-NJJYOA — W 전용)

| 기능 | 웹 | 모바일 | 상태 |
|---|---|---|---|
| /admin, /admin/inquiries(+[id]), /admin/faq | ✅ | — | 🚫 명세상 W 전용 |

## Phase 4 완료 (2026-07-04)

P1 전체 + P2(약관 분리·문의 세분화) 완료. calendar는 meetings로 커버 (웹 /calendar는 redirect 전용).
잔여: Phase 5 IA 대조 항목들 (생성 플로우·탐색 지도·사진 탭·프로필 편집·계정 관리·FAQ·재모임 역패리티).
