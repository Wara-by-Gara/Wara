# Wara 아이콘 규칙

> 아이콘 토큰과 사용 인벤토리.
> 전체 디자인 토큰은 `src/styles/DESIGN.md` 참고.

---

## 1. Icon 토큰

### 1.1 아이콘 크기

| 토큰 | 크기 | 사용처 |
|---|---:|---|
| icon-xs | 12px | 배지 내부 |
| icon-sm | 16px | 작은 버튼, 보조 정보 |
| icon-md | 20px | 입력 필드, 리스트 |
| icon-lg | 24px | 탭바, 앱바, 주요 액션 |
| icon-xl | 32px | Empty State, 큰 장식 |

### 1.2 아이콘 규칙

- 한 프로젝트 안에서는 아이콘 스타일을 섞지 않습니다.
- 기본 아이콘은 outline 스타일을 사용합니다.
- stroke width는 2px 기준으로 통일합니다.
- 탭바 아이콘은 24px을 기본으로 합니다.
- 작은 텍스트 옆 아이콘은 16px을 사용합니다.
- Empty State 아이콘은 32~48px까지 사용할 수 있습니다.
- 소셜 로그인 아이콘은 공식 로고 형태를 유지합니다.

### 1.3 Wara에 필요한 기본 아이콘

```txt
home
invitation
plus
bell
user
settings
calendar
clock
map-pin
navigation
search
filter
share
copy
link
qrcode
heart
check
x
minus
edit
trash
more-horizontal
chevron-left
chevron-right
chevron-down
camera
image
upload
download
message-circle
users
user-plus
lock
unlock
eye
eye-off
alert-circle
info
check-circle
x-circle
```

### 1.4 Wara 전용 장식 아이콘

```txt
pixel-airplane
pixel-heart
sparkle
ribbon
sticker-flower
sticker-smile
retro-camera
ticket
party-popper
mini-cloud
```

전용 장식 아이콘은 필수 UI가 아니라 감성 요소입니다.
기능 아이콘과 장식 아이콘을 섞어 사용하지 않습니다.

---

## 2. Wara Icon Inventory

> 아이콘은 처음부터 전부 직접 제작하지 않습니다.
> 기본 기능 아이콘은 `Lucide`, `Iconify`, `Material Symbols` 중 하나의 스타일로 통일하고, Wara 전용 감성 아이콘만 별도로 제작합니다.

### 2.1 아이콘 제작 규칙

| 항목 | 규칙 |
|---|---|
| 기본 크기 | 24px |
| 작은 아이콘 | 16px |
| 큰 아이콘 | 32px |
| Empty State 아이콘 | 40~48px |
| Stroke | 2px |
| 스타일 | Outline 중심 |
| 터치 영역 | 최소 44 × 44px |
| 기본 색상 | gray-700 |
| 활성 색상 | primary |
| 비활성 색상 | gray-300 |
| 위험 액션 | danger |
| 장식 아이콘 | pixel / sticker 스타일 가능 |

### 2.2 네비게이션 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| home | 홈 이동 | 하단 탭바 |
| invitation | 초대장 목록 | 하단 탭바, 홈 |
| plus | 새 초대장 만들기 | FAB, 버튼 |
| bell | 알림 | 앱바, 하단 탭 |
| user | 마이페이지 | 하단 탭바 |
| settings | 설정 | 마이페이지 |
| chevron-left | 뒤로가기 | 앱바 |
| chevron-right | 상세 이동 | 리스트, 카드 |
| chevron-down | 펼치기 | 드롭다운, 아코디언 |
| menu | 메뉴 열기 | 앱바 |
| close | 닫기 | 모달, 바텀시트, 뷰어 |
| more-horizontal | 더보기 | 카드, 댓글, 사진 |
| search | 검색 | 검색창, 앱바 |
| filter | 필터 | 목록 화면 |
| sort | 정렬 | 목록 화면 |

### 2.3 초대장 관련 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| calendar | 날짜 | 초대장 카드, 상세, 만들기 |
| clock | 시간 | 초대장 상세, 폼 |
| map-pin | 장소 | 초대장 상세, 지도 |
| navigation | 길찾기 | 장소 카드 |
| link | 초대 링크 | 공유 화면 |
| copy | 링크 복사 | 공유 바텀시트 |
| share | 공유하기 | 앱바, 버튼 |
| qr-code | QR 코드 | 공유 화면 |
| edit | 초대장 수정 | 호스트 상세 |
| trash | 초대장 삭제 | 호스트 메뉴 |
| save | 임시저장 | 만들기 화면 |
| eye | 미리보기 | 만들기 화면 |
| eye-off | 비공개 | 공개 설정 |
| lock | 비밀번호 초대장 | 공개 설정 |
| unlock | 공개 초대장 | 공개 설정 |
| image | 대표 이미지 | 만들기 화면 |
| palette | 디자인 편집 | 템플릿/스타일 화면 |
| sparkles | 템플릿 추천 | 템플릿 화면 |

### 2.4 RSVP / 참석 상태 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| check | 참석 | RSVP 버튼 |
| help-circle | 미정 | RSVP 버튼 |
| x | 불참 | RSVP 버튼 |
| users | 참석자 전체 | 참석자 명단 |
| user-plus | 초대하기 | 참석자 관리 |
| user-check | 참석 완료 | 상태 배지 |
| user-x | 불참 | 상태 배지 |
| hourglass | 미응답/대기 | 참석자 상태 |
| crown | 호스트 | 호스트 배지 (outline) |
| crown-yellow | 호스트 | 호스트 배지 (filled, yellow-300 #FFD43B) |
| badge-check | 확정됨 | RSVP 완료 |
| alert-circle | 마감/정원 초과 | RSVP 제한 |
| plus-circle | 동반 인원 추가 | RSVP 폼 |
| minus-circle | 동반 인원 감소 | RSVP 폼 |

### 2.5 참석자 명단 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| user-round | 참석자 프로필 | 참석자 아이템 |
| users-round | 그룹 | 요약 카드 |
| message-square | 요청사항 | 참석자 상세 |
| clipboard-list | 질문 답변 | 참석자 상세 |
| memo | 호스트 메모 | 참석자 관리 |
| mail | 초대 재전송 | 참석자 관리 |
| phone | 연락처 초대 | 초대 화면 |
| download | 명단 내보내기 | 호스트 관리 |
| shield | 권한 제한 | 비공개 명단 |

### 2.6 지도 / 장소 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| map | 지도 전체보기 | 지도 화면 |
| map-pin | 장소 핀 | 장소 카드 |
| locate | 현재 위치 | 장소 검색 |
| route | 길찾기 | 지도 바텀시트 |
| copy | 주소 복사 | 장소 카드 |
| external-link | 지도 앱 열기 | 지도 앱 선택 |
| building | 장소명 | 장소 정보 |
| globe | 온라인 모임 | 온라인 링크 |
| wifi | 온라인/비대면 | 장소 타입 |
| alert-triangle | 지도 오류 | 지도 오류 화면 |

### 2.7 앨범 / 사진 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| camera | 카메라 촬영 | 사진 업로드 |
| image | 사진 | 앨범 |
| images | 여러 장 사진 | 사진 선택 |
| upload | 업로드 | 앨범 CTA |
| download | 저장 | 사진 상세 |
| share | 사진 공유 | 사진 상세 |
| heart | 좋아요를 넣는 경우 | 사진 상세 |
| trash | 사진 삭제 | 사진 더보기 |
| flag | 사진 신고 | 사진 더보기 |
| rotate-cw | 재시도 | 업로드 실패 |
| zoom-in | 확대 | 사진 뷰어 |
| x | 뷰어 닫기 | 사진 상세 |

### 2.8 댓글 / 방명록 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| message-circle | 댓글 | 댓글 섹션 |
| send | 댓글 등록 | 댓글 입력창 |
| edit | 댓글 수정 | 댓글 더보기 |
| trash | 댓글 삭제 | 댓글 더보기 |
| flag | 댓글 신고 | 댓글 더보기 |
| reply | 답글 | 답글 기능 |
| smile | 이모지 | 댓글 입력 |
| lock | 댓글 제한 | 비로그인 상태 |

### 2.9 알림 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| bell | 알림 기본 | 앱바 |
| bell-dot | 새 알림 | 앱바 |
| check-circle | 읽음 처리 | 알림 액션 |
| message-circle | 새 댓글 알림 | 알림 리스트 |
| image | 새 사진 알림 | 알림 리스트 |
| user-check | 새 참석 알림 | 알림 리스트 |
| calendar-clock | 모임 전 알림 | 알림 리스트 |
| megaphone | 호스트 공지 | 알림 리스트 |
| settings | 알림 설정 | 알림 화면 |
| trash | 알림 삭제 | 알림 메뉴 |

### 2.10 인증 / 계정 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| kakao-logo | 카카오 로그인 | 로그인 |
| naver-logo | 네이버 로그인 | 로그인 |
| apple-logo | 애플 로그인 | 로그인 |
| log-out | 로그아웃 | 설정 |
| user-round-cog | 프로필 수정 | 마이페이지 |
| shield-check | 개인정보/보안 | 설정 |
| file-text | 약관 | 설정 |
| lock-keyhole | 권한/보안 | 계정 |
| alert-circle | 로그인 실패 | 에러 상태 |

### 2.11 Wara 전용 장식 아이콘

| 아이콘 | 용도 | 사용 위치 |
|---|---|---|
| pixel-airplane | 픽셀 종이비행기 (Wara 마스코트) | 로고, Splash, 초대장 발행, Empty State |
| pixel-heart | 픽셀 하트 | RSVP, 앨범 |
| sparkle | 반짝임 | CTA 주변, 템플릿 |
| ribbon | 리본 | 초대장 제목 영역 |
| sticker-flower | 꽃 스티커 | 템플릿 |
| sticker-smile | 스마일 스티커 | 온보딩 |
| retro-camera | 레트로 카메라 | 앨범 Empty |
| ticket | 초대 티켓 | 초대장 카드 |
| party-popper | 파티 | 발행 완료 |
| mini-cloud | 구름 | 파스텔 배경 |
| mini-bow | 리본 장식 | 초대장 템플릿 |
| pixel-check | 픽셀 체크 | RSVP 완료 |
