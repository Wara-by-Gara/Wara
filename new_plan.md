# WARA — 기능명세서 ↔ 코드 구현 상태 대조 (new_plan)

> 작성일: 2026-07-01
> 기준 명세: manyfast "WARA - 통합 모임/이벤트 초대장 서비스" (projectId `50ef2cb6-...`) — 16 요구사항 / 55 기능 / 110 스펙
> 대조 대상: `apps/api` (NestJS), `apps/web` (Next), `apps/mobile`
> 판정: ✅ 구현 · 🟡 부분구현 · ❌ 미구현 · ❓ 불명확

---

## 0. 요약 통계 (110 스펙 기준)

| 판정 | 개수 | 비율 |
|------|:--:|:--:|
| ✅ 구현 | 64 | ~58% |
| 🟡 부분구현 | 22 | ~20% |
| ❌ 미구현 | 20 | ~18% |
| ❓ 불명확 | 4 | ~4% |

**요구사항별 완성도 개관**

| 요구사항 | 상태 | 한줄 요약 |
|------|------|------|
| R-REENMY 회원가입/로그인 | 🟢 대체로 완성 | OAuth·병합·로그아웃 완성. 탈퇴 **유예** 없음 |
| R-RWXOOV 초대장 생성/공유 | 🟡 | 템플릿·편집·비번해시 완성. **BGM 전무**, 시도제한·공유문구 편집 없음 |
| R-PSWNJG AI 이미지 | 🟢 대체로 완성 | 생성·일일제한·서킷브레이커·타임아웃 완성. 폴백/남은횟수만 미흡 |
| R-FNIWJR 일정 조율 | 🟡 | 투표·확정·알림 완성. **커스텀 투표·다중투표·되돌리기** 없음 |
| R-FOTKSQ 참가자 관리 | 🟢 대체로 완성 | RSVP·위임·공동호스트·차단 완성. 차단 **사유기록** 없음 |
| R-CTCIIZ 소통 채널 | 🟡 | DM·댓글·알림 완성. **공지고정·활동피드 조회·대화검색** 없음 |
| R-XTUKTC 위치 공유 | 🟡 | 실시간 공유·지도 완성. **프라이버시 티어 전무** (⚠️ CLAUDE.md 오기) |
| R-GRVDJB 사진 | 🟢 대체로 완성 | 업로드·좋아요·베스트·중복·지도 완성. **신고/숨김** 없음 |
| R-QXNIND 비용 정산 | 🔴 **전무** | 스키마·API·UI 0%. high 중요도인데 미착수 |
| R-BFNULL 리마인드/재모임 | 🟡 | 재모임 복제·수신설정 있음. 발송시점 명세불일치, 별점/리뷰 없음 |
| R-TOMOAT 공개 초대장 | 🟡 | 공개토글·열람·RSVP 완성. **모바일 주변탐색·신고** 없음 |
| R-EXKDIN 친구 | 🟡 | 파생친구 숨김/복원 있음. **자동추가·빠른선택** 없음 |
| R-SCOBES 마이페이지 | 🟡 | 프로필·설정·탈퇴 있음. 상태메시지·저장내역·모임별알림·필터 미흡 |
| R-RMZDGD 고객센터 | 🟡 | 문의 작성/조회/답변 완성. **FAQ 사용자 화면** 없음 |
| R-UBNIJA 약관 | 🟢 완성 | 버전 재동의·전문열람 완성 |
| R-NJJYOA 어드민 | 🟡 | 대시보드 지표 완성. **사용자/모임관리·신고처리·운영설정** 없음 |

---

## 1. 스펙 단위 상세 대조

### R-REENMY 회원가입/로그인
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-TRBWGU S-EAPNMP 시작/콜백 | ✅ | `auth.controller.ts:61-123`, `auth.service.ts:82-90` — URL 생성·콜백·JWT 발급 완성 |
| F-TRBWGU S-KXJTCG 신규 vs 병합 | ✅ | `auth.service.ts:187-236`(socialLogin), `293-408`(link/merge) — mergeToken 병합 플로우 |
| F-TRBWGU S-YVDJND 제공자 정책·애플 숨김이메일 | 🟡 | `oauth-policy.service.ts`, `users.ts:27-40`(isPrivateEmail) — provider별 정책 검증 세부 확인 필요 |
| F-EJNNGR S-GXLGJO 로그아웃 | ✅ | `auth.controller.ts:205-219`, `auth.service.ts:410-421` — 세션 무효화·재사용 감지 |
| F-EJNNGR S-XYSNOG 탈퇴/유예 | 🟡 | `users.service.ts:116-145` soft delete 즉시 실행. **명세의 30일 유예 없음** |

### R-RWXOOV 초대장 생성 및 공유
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-PFLCKA S-RPMFRI 템플릿 목록/미리보기 | ✅ | `templates.service.ts`, `AiCompositeSheet.tsx:31-35` |
| F-PFLCKA S-XMWTGJ 기본정보 입력 | ✅ | `InvitationCreateContainer.tsx:292-310` |
| F-PFLCKA S-OECKET 디자인 편집(테마/배경/애니) | ✅ | `InvitationCreateContainer.tsx:258-262`, `invitations.ts:42-50` |
| F-PFLCKA S-OEDWWE 참여자 아바타 | ✅ | `invitations.service.ts:144-171` |
| F-PFLCKA S-ANESSL RSVP 버튼 | ✅ | `InvitationCreateContainer.tsx:268-357`, `invitations.ts:44-49` |
| F-UMDBGD S-HJNCIM 공유링크 생성/복사 | ✅ | `ShareBottomSheet.tsx:14-48` (링크·카톡·SMS·인스타) |
| F-UMDBGD S-YRBTRI OG 미리보기 | 🟡 | `og-image.service.ts:18-40` — **GIF 커버만** OG 생성, 일반이미지 미제공 |
| F-UMDBGD S-HLZVXV 공유 기본문구 편집 | ❌ | 공유 채널 하드코딩, 문구 커스터마이징 UI 없음 |
| F-NGSSTO S-THLGZB 비밀번호 해시 저장 | ✅ | `invitations.service.ts:261-291` scrypt 해시·검증 |
| F-NGSSTO S-MYIFWU 입력 게이트 시도제한 | ❌ | `verifyAccess`에 Throttle/시도제한 없음 — **brute-force 취약** |
| F-NGSSTO S-ONFCXJ 변경·링크 재발급 | 🟡 | 비번 변경만 가능, 링크 재발급(URL 회전) 없음 |
| F-ROXICR S-CDWTPH/NPMCBM/WSENPQ BGM | ❌ | **스키마·API·UI 전무 — 전체 미구현** |

### R-PSWNJG AI 이미지 생성
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-QYVVKC S-CCBXJK OpenAI 호출 | ✅ | `ai.service.ts:84-100` (gpt-image-1 images.edit) |
| F-QYVVKC S-SKKZPM 미리보기/선택 | ✅ | `AiCompositeSheet.tsx:120-127`, presigned download |
| F-OLZDPC S-PIKHHO 일일 3회 제한 | ✅ | `invitations.service.ts:46,413-417` + ai-generations 합산 한도 |
| F-OLZDPC S-YVYEAB 남은횟수 표시 | 🟡 | 초과 시 에러만, **남은횟수 조회 API 없음** |
| F-OLZDPC S-NDWBQP 초과 안내 | ✅ | `AiCompositeSheet.tsx:12-18` |
| F-EPOHCF S-QSTATV 서킷브레이커 | ✅ | `ai-monitoring.service.ts:14-64` (10분 크론, 60건 임계, 30분 복구) |
| F-EPOHCF S-XBFGIT 실패 시 대체옵션 | ❌ | 서킷 오픈 시 503 즉시 반환, **폴백/대체 이미지 없음** |
| F-EPOHCF S-FACYJW 지연/타임아웃 | ✅ | `ai.service.ts:7,74-103` (60초 타임아웃, 지수백오프 2회) |

### R-FNIWJR 일정 조율 및 확정
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-KEPBSV S-YFQGAT 슬롯 추가/수정/삭제 | 🟡 | `date-vote.service.ts:126-172` 추가/삭제만, **수정(PATCH) 없음** |
| F-KEPBSV S-GVHLFH 마감 설정/연장 | ✅ | `date-vote.service.ts:53-121`, `DateVote.tsx:590-627` |
| F-KEPBSV S-YFMMJG 투표 링크/진입 | ✅ | /vote 경로 |
| F-KEPBSV S-XEUVDI 투표유형(날짜/시간/커스텀) | 🟡 | date+startTime만, **커스텀(텍스트) 유형 미지원** |
| F-KEPBSV S-GMEASP 30개 제한/빠른추가 | ✅ | `date-vote.service.ts:17`(SLOT_LIMIT=30) |
| F-KEPBSV S-JDTJFW 여러 투표 생성/관리 | ❌ | 초대장당 1투표만 (`43-49` ConflictException) |
| F-TMAXOC S-LPXPYL 복수/불가 선택 | ✅ | `submit-responses.dto.ts:4-5` |
| F-TMAXOC S-TNWTCZ 내 투표 확인/변경 | ✅ | `date-vote.service.ts:86-202` |
| F-TMAXOC S-SHBOPO 현황요약/유력슬롯 | ✅ | `date-vote.service.ts:215-241`, `DateVote.tsx:880-887` |
| F-TMAXOC S-JKVDRU 커스텀 투표 단일/복수 | ❌ | 커스텀 항목 부재 → 불가 |
| F-XRMNXP S-DUMDYU 확정/되돌리기 | 🟡 | `confirmSlot` 있음, **되돌리기 API 없음** |
| F-XRMNXP S-EOXMFM 초대장 반영 | ✅ | `date-vote.service.ts:409` (eventStartAt 업데이트) |
| F-XRMNXP S-SARYMG 확정 알림 | ✅ | `date-vote.service.ts:420-428` |
| F-XRMNXP S-XLJOWL 공동1등 호스트 선택 | ✅ | `date-vote.service.ts:358-382`, `DateVote.tsx:1054-1056` |

### R-FOTKSQ 참가자 관리
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-MBOMQU S-BFHIYM 상태목록 조회 | ✅ | `participants.service.ts:38-64` (summary) |
| F-MBOMQU S-KTCOMR RSVP 응답 | ✅ | `participants.controller.ts:80-89`, RSVPButtonGroup |
| F-MBOMQU S-CGJHOV 통계/요약 | ✅ | summary + ParticipantSummaryCard |
| F-GZGMHJ S-LZMEHE 전체위임 | ✅ | `participants.controller.ts:91-104`, `service:193-215` |
| F-GZGMHJ S-FXJNUO 공동호스트 지정/해제 | ✅ | `participants.controller.ts:107-120`, `service:218-248` |
| F-GZGMHJ S-JUQWXA 위임 안내/확인 | ❓ | 위임 후 알림 발송 여부 불명확 |
| F-RIBUFY S-FYFCHX 참가자 제거 | ✅ | `participants.controller.ts:122-130`, kickAndBlock |
| F-RIBUFY S-QOMRSH 참가자 차단 | ✅ | `blocklist.controller.ts:14-26`, invitationBlocklists |
| F-RIBUFY S-OFEOYL 사유기록/통지 | ❌ | blocklist에 reason 컬럼·통지 없음 |

### R-CTCIIZ 소통 채널
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-FHPQJD S-UXOFLN 텍스트 전송 | ✅ | `conversations.service.ts:sendMessage` (≤1000자) |
| F-FHPQJD S-UFBLFZ 이미지/이모지 | ✅ | presigned imageKey + toggleReaction |
| F-FHPQJD S-BDZMFH 공지 고정 | ❌ | pinned 필드·API 없음 |
| F-UKCZZH S-OCZUIF 대화 시작 | ✅ | `POST /conversations` createOrGet (멱등) |
| F-UKCZZH S-HFLNEK 대화목록/검색 | 🟡 | 목록 ✅, **검색 미구현** |
| F-UKCZZH S-FZDASD DM 알림제어 | 🟡 | 설정 API 있으나 DM 전용 구분 불명확 |
| F-MZPMRW S-YBSASJ 푸시/웹 알림 | ✅ | `notify()` 비동기 발송 |
| F-MZPMRW S-MHGJJD 모임별/전체 설정 | ✅ | `/notifications/settings` invitationId별 |
| F-MZPMRW S-SDKQFZ 실시간 품질지표 | ❌ | 메트릭/대시보드 없음 |
| F-XGWBYE S-JZNTJB 이벤트타입 정의 | ✅ | `activity-events.ts` eventType 열거 |
| F-XGWBYE S-JZBGVX 실시간 동기화/백필 | ❌ | **record()만, 조회 API·WebSocket·UI 없음** |
| F-DPZZXZ S-AJTWDD 댓글(태그/사진/GIF) | ✅ | feedbacks: gifUrl·attachedPhotoId·parentId·mentionedUserIds |
| F-DQUTXZ 호스트 공지 (spec 미정) | 🟡 | `text-blasts` 모듈 존재(단체공지) — 명세 spec 미정으로 매핑 확인 필요 |

### R-XTUKTC 위치 공유
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-QOHBNO S-WJBYGT 토글 | ✅ | `locations.controller.ts:76-85` |
| F-QOHBNO S-VSVAFY GPS 실시간 추적 | ✅ | `locations.redis-store.ts`, `locations.gateway.ts` (WS) |
| F-QOHBNO S-GAHCGR 상태표시/타임스탬프 | ✅ | `locations.ts:25-41` (statusMessage, updatedAt) |
| F-ELEOWP S-KCKLCY 티어 선택 | ❌ | privacyTier 컬럼 없음 |
| F-ELEOWP S-VGIYHB 기본/모임별 조정 | ❌ | 미구현 |
| F-ELEOWP S-ULTZWS 변경 즉시반영 | ❌ | 미구현 |
| F-SZVDFN S-MZKFTN 지도 로드/마커 | ✅ | `MapPage.tsx:98-150` |
| F-SZVDFN S-MHBBMR 마커탭 정보 | ✅ | `locations.service.ts:115-155` |
| F-SZVDFN S-CHPWCH 실시간 업데이트 | ✅ | `locations.gateway.ts` (WS + Redis 구독) |
| F-SZVDFN S-KNVVIT 주기/배터리 안내 | ❓ | 명시적 안내 UI 없음 |

> ⚠️ **CLAUDE.md 정합성**: 기존 Scope에 "위치 — tier별 privacy"로 기재돼 있었으나 **실제 코드엔 프라이버시 티어가 없음**. 현재 모든 참가자에게 정확 GPS 노출.

### R-GRVDJB 사진
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-ONZZVH S-YIFCMK 다중 업로드 | ✅ | presigned→S3→DB 3단계 |
| F-ONZZVH S-NZWCRO MIME 검증/제한 | ✅ | jpeg/png/webp/heic/heif, 매직넘버 sniff, 10MB |
| F-ONZZVH S-EHSHKO 그리드/정렬 | ✅ | createdAt/takenAt 정렬, cursor 페이지네이션 |
| F-JOHVID S-WREQLZ 좋아요/취소 | ✅ | toggleLike (낙관적 업데이트) |
| F-JOHVID S-XLUQJX 댓글 작성/삭제 | ✅ | createForPhoto, soft delete |
| F-JOHVID S-ZHHHHY 신고/숨김 | ❌ | 신고/숨김 API·스키마 없음 |
| F-XDIPRF S-FDSVVY 대표·베스트 | ✅ | best9 (view×0.5+like×1.0+fb×1.5) |
| F-XDIPRF S-UQDXMK 중복 감지 | ✅ | EXIF 지문(takenAt+기기+GPS+크기) → PHOTO_DUPLICATE |
| F-XDIPRF S-FWRMAK 사진 지도 | ✅ | `GET /photos/locations` |

### R-QXNIND 비용 정산 — 🔴 전체 미구현
| 스펙 | 판정 | 근거 |
|------|:--:|------|
| F-HXJLCE S-SIZZCF/IRPDRC/RJCQCA | ❌ | settlement/expense/payment 모듈·스키마·UI 전무 |
| F-FABSQQ S-GRVMEA/RBPBLL/QGXASM | ❌ | 정산 계산·송금표 없음 |
| F-OOKNFO S-XIEBRE/PJWPWR/XNWYEE | ❌ | 공유링크·이미지카드·익명화 없음 |

### R-BFNULL 리마인드 및 재모임
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-FUNIDM S-KEGRNV 발송시점 | 🟡 | `remind-scheduler.service.ts:22-36` D-1/D+7/D+30/D+365 — **명세 "7/30일 전"과 방향 불일치** |
| F-FUNIDM S-JZABXF 수신/무음 | ✅ | notificationSettings.isRemind |
| F-FUNIDM S-MVZANX 재알림 정책 | ❌ | 1회 발송만, 재알림 로직 없음 |
| F-NJTOMM S-ALXPVX 하이라이트 자동구성 | 🟡 | BestNineModal 있음, 자동/수동 로직 불명확 |
| F-NJTOMM S-LHOBRB 앨범/정산 빠른이동 | 🟡 | 앨범 이동만, **정산 부재로 정산 링크 불가** |
| F-NJTOMM S-GNDEQG 하이라이트 공유 | ❓ | 공유 기능 미확인 |
| F-YWWZNF S-FEVLCB 멤버/설정 불러오기 | ✅ | `invitations.repository.ts:322-370` clone (22필드) |
| F-YWWZNF S-BEZXZU 복제 후 생성진입 | ✅ | `useCloneInvitation()` |
| F-YWWZNF S-UKYAHA 복제범위 선택 | ❓ | 전체 일괄복사만, 선택옵션 없음 |
| F-IDGKWC 별점/리뷰 (spec 미정) | ❌ | 관련 모듈·스키마 전무 |

### R-TOMOAT 공개 초대장
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-HDMEOT S-JZNYKW 공개/비공개 토글 | ✅ | `invitations.ts:56`(isPublic), `InvitationCreateContainer.tsx:1721-1727` |
| F-WASSLI S-PYYOWQ 공개 상세열람 | ✅ | `invitations.controller.ts:92-96` @Public |
| F-WASSLI S-MXFUPA 공개 RSVP | ✅ | 참가자 RSVP 재사용 |
| F-KAHNVA S-OYYYSM 위치권한/등록 | 🟡 | 모바일 `api/locations.ts`만, 등록 UI/로직 없음 |
| F-KAHNVA S-UNREHJ 주변 공개모임 목록 | ❌ | 웹 `/explore`만, **모바일 탐색 탭 부재** (명세는 모바일 전용) |
| F-KAHNVA S-PLZIEZ 공개모임 신고/숨김 | ❌ | 신고 처리 없음 |

### R-EXKDIN 친구
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-JXCVQQ S-ANUCGX 자동추가 조건/시점 | ❌ | 공동참여 파생만, 자동추가 정책 없음 |
| F-JXCVQQ S-ROGBNG 숨김/삭제/재추가 | ✅ | `friends.service.ts:118-140`, friend-hides, useHide/Restore |
| F-RQBFNV S-NPFOXN 빠른선택(초대/DM) | ❌ | 친구→초대/DM 빠른 이동 UI 없음 |

### R-SCOBES 마이페이지
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-QERKMV S-BLHFEI 프로필 조회 | ✅ | `users.controller.ts:41-44`, `users.repository.ts:12-25` |
| F-QERKMV S-HMYVDG 편집(닉네임/사진/상태메시지) | 🟡 | 이름/이메일/사진 편집 ✅, **상태메시지 스키마·UI 없음** |
| F-MPBPAP S-JPGKAL 목록 탭/필터 | 🟡 | 최근 10개만, 탭/필터 미확인 |
| F-MPBPAP S-GHQRSX 모임 카드 | 🟡 | 카드만, 상세목록 미확인 |
| F-MPBPAP S-LRTMBN 빠른접근 CTA | 🟡 | 미확인 |
| F-OAGNIV S-TYGJIE 알림설정 전체/모임별 | 🟡 | 전체 설정만, **모임별 개별 제어 없음** |
| F-AWFJXB S-KZIJGR 유형별 분류 | ❌ | 저장/공유 내역 조회 없음 |
| F-AWFJXB S-PEOVCR 삭제/정리 | ❌ | 없음 |
| F-RRGTST S-KCNFTA 고객센터 진입 | ✅ | `SettingsContainer.tsx:76` |

### R-RMZDGD 고객센터
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-SIVXPW S-FFUCLF 검색/카테고리 | 🟡 | `faq.service.ts:11-13` getActive 있으나 **사용자 FAQ 화면 없음** (어드민만) |
| F-SIVXPW S-SRCUOD 상세/도움말 | 🟡 | findById 있으나 사용자 UI 없음 |
| F-CJCIXI S-EGTSKY 유형/첨부 접수 | ✅ | `/inquiries/write` — 유형·제목·내용 (첨부 DTO 미정) |
| F-IOFTOP S-YYBFAL 목록 조회 | ✅ | `/inquiries` |
| F-IOFTOP S-BZXCZO 상세/답변 확인 | ✅ | answer·answeredAt 표시 |

### R-UBNIJA 약관
| 스펙 | 판정 | 근거 |
|------|:--:|------|
| F-YECRCZ S-XEJEBQ 버전 갱신 재동의 | ✅ | `terms.controller.ts:29-50`, `TermsAgreeContainer.tsx:85-94` |
| F-MJUIEM S-WBVANH 전문 열람 | ✅ | `terms.controller.ts:37-40`, `SettingsContainer.tsx:31-50` |

### R-NJJYOA 어드민
| 스펙 | 판정 | 근거 · 차이 |
|------|:--:|------|
| F-YSMPKQ S-NBKIZW 인증/역할 메뉴 | ✅ | `@AdminOnly()`, `/admin` |
| F-UBKGMJ S-SMLGYK 검색/상세조회 | ❌ | 어드민 사용자/모임 조회 API 없음 |
| F-UBKGMJ S-EPMKQS 사용자 상태변경/제재 | ❌ | 없음 |
| F-UBKGMJ S-YQPAUT 모임 상태변경/삭제 | 🟡 | 초대장 DELETE만, 어드민 강제관리 없음 |
| F-VVMKGM S-AQQDWN 신고큐 처리 | ❌ | 신고 큐·메모·상태 관리 전무 |
| F-OPDSEN S-VBNAGP 운영설정/변경이력 | ❌ | 정책 관리 API·화면 없음 |
| F-CZIBFZ S-FMYZWK 오류로그 조회 | 🟡 | invitationSendLogs 테이블만, 어드민 조회 API 없음 |
| F-CZIBFZ S-IEHKNN 공유링크 회수 | ❌ | 링크 무효화 없음 |
| F-CUNLON S-JFYNFB 대시보드 구성 | ✅ | `dashboard.controller.ts` |
| F-CUNLON S-TCYOTI MAU/DAU/WAU | ✅ | `dashboard.service.ts:107-162` |
| F-CUNLON S-GPQGEM 리텐션 | ✅ | getRetention (코호트 주간) |
| F-CUNLON S-XWFMHJ 전환/퍼널 | 🟡 | 수량만, 단계별 전환율 없음 |

---

## 2. 우선순위 갭 (권장 작업 순서)

### P0 — high 중요도인데 전무/치명적
1. **R-QXNIND 비용 정산 전체** (9 스펙 ❌) — high 요구사항 통째 미착수. 스키마→API→계산(송금표)→공유 순으로 신규 구현 필요.
2. **F-NGSSTO S-MYIFWU 비밀번호 시도제한** (❌) — 보안 취약. `verifyAccess`에 Throttle+쿨다운 추가 (소규모).
3. **F-XGWBYE S-JZBGVX 활동 피드 조회/실시간** (❌) — 이벤트 record만 하고 노출 안 됨. 조회 API + WS + 웹 UI.

### P1 — high 기능의 핵심 스펙 누락
4. **F-FHPQJD S-BDZMFH 공지 고정** (❌) — 그룹 DM 핵심.
5. **R-XTUKTC F-ELEOWP 프라이버시 티어** (3 ❌) — 개인정보 옵션 없음. privacyTier 컬럼 + 거리만/비공개 로직 + CLAUDE.md 정합.
6. **F-KEPBSV/F-TMAXOC 커스텀 투표** (S-XEUVDI, S-JKVDRU ❌) — "장소/메뉴 투표" 유즈케이스.
7. **F-JOHVID S-ZHHHHY 사진 신고/숨김 + F-VVMKGM 신고처리** — 모더레이션 체인(사용자 신고 → 어드민 큐)이 통째 없음.
8. **F-UBKGMJ 어드민 사용자/모임 관리** (2 ❌) — 운영 필수.

### P2 — 부분구현 보완 / medium
9. F-EJNNGR S-XYSNOG 탈퇴 유예(30일)
10. F-ROXICR BGM (전무, medium)
11. F-UMDBGD S-HLZVXV 공유문구 편집 + S-YRBTRI 일반이미지 OG
12. F-KEPBSV S-JDTJFW 다중투표 · S-YFQGAT 슬롯 수정 · F-XRMNXP S-DUMDYU 확정 되돌리기
13. F-RIBUFY S-OFEOYL 차단 사유기록
14. F-OAGNIV S-TYGJIE 모임별 알림 · F-QERKMV 상태메시지 · F-MPBPAP 목록 필터
15. F-SIVXPW 사용자 FAQ 화면 · F-AWFJXB 저장/공유 내역

### P3 — low / 탐색·불명확
16. F-KAHNVA 모바일 주변 공개모임 탐색(S-UNREHJ) · S-PLZIEZ 신고
17. F-JXCVQQ S-ANUCGX 친구 자동추가 · F-RQBFNV S-NPFOXN 빠른선택
18. F-IDGKWC 별점/리뷰 · F-FUNIDM S-MVZANX 재알림 · F-EPOHCF S-XBFGIT AI 폴백
19. ❓ 확인 필요: S-JUQWXA(위임 알림), S-KNVVIT(위치 주기/배터리), S-GNDEQG/S-UKYAHA(재모임), F-DQUTXZ↔text-blasts 매핑

---

## 3. 명세-코드 불일치 · 후속 조치 메모

- **CLAUDE.md Scope 오기**: "위치 tier별 privacy"는 실제 미구현 → 명세 SoT 반영 시 주의 (본 대조로 확인).
- **명세 데이터 결함**: F-KEPBSV/F-TMAXOC/F-XRMNXP의 roles·devices 빈 배열, F-DQUTXZ·F-IDGKWC spec 미정 → manyfast 측 보완 필요.
- **리마인드 발송시점**: 명세("이벤트 7/30일 전")와 코드(D-1 + 이벤트 후 7/30/365일)가 방향 상충 → 기획 확정 필요.
- **모바일 앱**: 공개 초대장 탐색(F-KAHNVA)이 모바일 전용 명세이나 웹에만 `/explore` 존재. 모바일 구현 범위 재확인.
- **활동 피드**: 명세는 "활동 피드 댓글"이나 코드는 "초대장/사진 댓글"로 구현 — 활동 피드 자체(조회·노출)가 사실상 미완.
