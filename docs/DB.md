# (1) User(유저)

| key                   | type      | description                                             |
| --------------------- | --------- | ------------------------------------------------------- |
| **id**                | String    | **PK (ulid)**                                           |
| **email**             | String?   | nullable 처리, 소셜 로그인 - 이메일(중복x)              |
| **profile_image_url** | String?   | **소셜 로그인에서 받아온 프로필 이미지 URL (nullable)** |
| **name**              | String?   | 소셜 로그인 이름                                        |
| **nickname**          | String?   | 닉네임(2글자~8글자)                                     |
| **birth_year**        | Number?   | 출생년도                                                |
| **gender**            | Enum?     | 성별 (female = 여자, male = 남성)                       |
| **created_at**        | DateTime  | 작성일(생성일)                                          |
| **updated_at**        | DateTime  | 수정일                                                  |
| **deleted_at**        | DateTime? | soft delete                                             |
| **role**              | Enum      | 권한 (member = 일반 회원 , admin = 관리자)              |
| **last_login_at**     | DateTime? | 마지막 로그인 시각 (DAU/WAU/MAU 계산 전용)              |

---

# (2) SocialAccount**(소셜로그인 정보)**

| key                     | type     | description                                 |
| ----------------------- | -------- | ------------------------------------------- |
| **id**                  | String   | **PK (ulid)**                               |
| user_id                 | String   | FK                                          |
| **provider**            | Enum     | 가입 경로 (kakao, ~~google~~, naver, apple) |
| **provider_account_id** | String   | 가입 경로 고유 ID                           |
| **rawProfile**          | Json?    | 가입 경로별 원본데이터 참고용               |
| **created_at**          | DateTime | 작성일(생성일)                              |
| **updated_at**          | DateTime | 수정일                                      |

# (3) **invitation(초대장)**

- 초대장 생성, 수정, 삭제하는 테이블

| key                    | type      | description                                               |
| ---------------------- | --------- | --------------------------------------------------------- |
| **id**                 | String    | **PK (ulid)**                                             |
| **user_id**            | String    | 호스트 (FK)                                               |
| template_id            | String?   | 템플릿 디자인 (FK)                                        |
| status                 | Enum      | active, closed                                            |
| title                  | String    | 제목                                                      |
| description            | String    | 모임 설명                                                 |
| main_image_key         | String    | S3 업로드 후 반환된 object key                            |
| event_start_at         | DateTime? | 모임 시작 시간                                            |
| **is_mission_enabled** | Boolean   | 미션 활성화 여부 (default: false)                         |
| **created_at**         | DateTime  | 생성일                                                    |
| **updated_at**         | DateTime  | 수정일                                                    |

> 📌 장소 조회: `eventLocations.invitation_id` 로 단방향 참조. 순환 FK 방지.

---

# (4) participant (참여자)

- 초대장 참여한 유저와 초대장의 N:M 관계를 관리하는 테이블

| key               | type     | description                                                                             |
| ----------------- | -------- | --------------------------------------------------------------------------------------- |
| **id**            | String   | **PK (ulid)**                                                                           |
| **user_id**       | String   | 호스트 및 참여자 (FK)                                                                   |
| **invitation_id** | String   | 초대장 Id (FK)                                                                          |
| **member_role**   | Enum     | HOST, GUEST                                                                             |
| **rsvp_status**   | Enum     | 참여여부 ( `attending` = 참석, `undecided` = 미정, `absent` = 불참, `cancelled` = 취소) |
| **created_at**    | DateTime | 신청일                                                                                  |
| **updated_at**    | DateTime | 참여 정보 수정 시간                                                                     |

---

# **(5) InvitationSendLog**

| **key**           | **type** | **description**                 |
| ----------------- | -------- | ------------------------------- |
| **id**            | String   | PK                              |
| **invitation_id** | String   | 초대장 FK                       |
| **sender_id**     | String   | 발송자 FK                       |
| **channel**       | Enum     | link, kakao, sms, email, dm     |
| **invite_url**    | String?  | 공유 링크                       |
| **status**        | Enum     | sent, opened, responded, failed |
| **created_at**    | DateTime | 생성일                          |

---

# (6) photo (사진)

| key                | type     | description                                                     |
| ------------------ | -------- | --------------------------------------------------------------- |
| **id**             | String   | **PK (ulid)**                                                   |
| **participant_id** | string   | 참여자 고유 Id (FK) (업로드 유저)                               |
| **Invitation_id**  | String   | 초대장 고유 Id (Fk)                                             |
| **mission_id**     | String?  | 미션용                                                          |
| **image_key**      | String   | s3 업로드 후 반환 된 object key                                 |
| **exif_metadata**  | Json?    | EXIF 메타데이터 **{ taken_at, gps_lat, gps_lng, gps_address }** |
| **created_at**     | DateTime | 생성일                                                          |
| **updated_at**     | DateTime | 수정일                                                          |
| **deleted_at**     | DateTime | 소프트삭제                                                      |
| **view_count**     | Int      | 사진 조회수 (default: 0)                                        |
| **like_count**     | Int      | 좋아요                                                          |

---

# (7) Feedback (댓글)

| key                | type      | description                                                       |
| ------------------ | --------- | ----------------------------------------------------------------- |
| **id**             | String    | **PK (ulid)**                                                     |
| **participant_id** | string    | 참여자 고유 Id (FK)                                               |
| **invitation_id**  | String?   | 초대장 고유 Id (FK)                                               |
| **photo_id**       | String?   | 사진 고유 Id (FK)                                                 |
| **content**        | String    | 댓글 내용                                                         |
| **created_at**     | DateTime  | 생성일                                                            |
| **updated_at**     | DateTime  | 수정일                                                            |
| **is_deleted**     | Boolean   | 소프트 삭제 여부 (default: false)                                 |
| **deleted_at**     | DateTime? | 삭제 시각                                                         |
| **parent_id**      | String?   | 부모 댓글 Id (FK → Feedback 자기참조, **nullable = 최상위 댓글**) |
| **like_count**     | Int       | 좋아요                                                            |

> 📌 CHECK constraint: `invitation_id IS NOT NULL OR photo_id IS NOT NULL` — 둘 다 null인 고아 레코드 방지

---

# (7-1) PhotoLike (사진 좋아요)

> 📌 `photo.like_count`는 캐시용 집계 컬럼. 실제 좋아요 주체는 이 테이블로 관리.

| key                | type     | description              |
| ------------------ | -------- | ------------------------ |
| **id**             | String   | **PK (ulid)**            |
| **photo_id**       | String   | 사진 FK                  |
| **participant_id** | String   | 좋아요 누른 참여자 FK    |
| **created_at**     | DateTime | 생성일                   |

---

# (7-2) FeedbackLike (댓글 좋아요)

> 📌 `feedback.like_count`는 캐시용 집계 컬럼. 실제 좋아요 주체는 이 테이블로 관리.

| key                | type     | description              |
| ------------------ | -------- | ------------------------ |
| **id**             | String   | **PK (ulid)**            |
| **feedback_id**    | String   | 댓글 FK                  |
| **participant_id** | String   | 좋아요 누른 참여자 FK    |
| **created_at**     | DateTime | 생성일                   |

---

# (8) Notification(알림)

| key               | type     | description                             |
| ----------------- | -------- | --------------------------------------- |
| **id**            | String   | **PK**                                  |
| **user_id**       | String   | **FK (ulid) 알림 받을 유저**            |
| **actor_user_id** | String?  | **FK (ulid) 이벤트를 발생시킨 유저**    |
| **type**          | Enum     | 알림 유형 (notificationType) (알림종류) |
| **content**       | String   | 알림 메시지                             |
| **target_type?**  | Enum     | photo, feedback, invitation, 등등       |
| **target_id**     | String   | 관련 데이터 id                          |
| **created_at**    | DateTime | 생성일                                  |

### notificationType

- remind (리마인드) (7일 , 한달, 1년)
- participantLocations (참석자 위치)
- eventLocations (모임 장소 위치)
- feedback (댓글)
- invitation_date 초대장 모임 날짜 ( 1일전, 시작 15분전 , 도착 )
- photo (사진)

# (9) Notification Setting (알림 세팅)

| key                         | type    | description                                  |
| --------------------------- | ------- | -------------------------------------------- |
| **id**                      | String  | **PK**                                       |
| **user_id**                 | String  | **FK (ulid) 알림 받을 유저**                 |
| **is_remind**               | Boolean | 리마인드 알림 on/off (default: true)         |
| **is_feedback**             | Boolean | 댓글 알림 on/off (default: true)             |
| **is_invitation_date**      | Boolean | 초대장 모임 날짜 알림 on/off (default: true) |
| **is_photo**                | Boolean | 사진 알림 on/off (default: true)             |
| **is_mission**              | Boolean | 미션 알림 on/off (default: true)             |
| **is_participantLocations** | Boolean | 참석자 위치 알림 on/off (default: true)      |
| **is_eventLocations**       | Boolean | 모임 장소 위치 알림 on/off (default: true)   |

---

# (10) mission (미션)

- 하나의 초대장에 1개 이상의 미션을 만들 수 있다. [1:N]

| key                | type     | description                       |
| ------------------ | -------- | --------------------------------- |
| **id**             | String   | **PK (ulid)**                     |
| **invitation_id**  | String   | 초대장 고유 id (FK, cascade)      |
| **participant_id** | String   | 미션 작성자(=HOST의 participant)  |
| **content**        | String   | 미션 내용 (1~200자, Trojan 차단)  |
| **created_at**     | DateTime | 생성일                            |
| **updated_at**     | DateTime | 수정일                            |

- 호스트가 미션을 1개 이상 등록할 수 있다.
- `participant_id`는 작성자 (photos/feedbacks 패턴과 동일).
- 발송 시 `attending` GUEST에게 Fisher-Yates 셔플로 랜덤 균등 배정.
- soft delete 없음 — V1.0은 hard delete.

---

# (10-A) mission_templates (미션 공용 카탈로그)

- 호스트가 모임에 추가할 수 있는 시스템 제공 미션 풀 (admin/seed).

| key            | type     | description                          |
| -------------- | -------- | ------------------------------------ |
| **id**         | String   | **PK (ulid)**                        |
| **content**    | String   | 미션 내용                            |
| **is_active**  | Boolean  | 노출 여부 (default: true)            |
| **created_at** | DateTime | 생성일                               |
| **updated_at** | DateTime | 수정일                               |

- 시드 10개 기본 제공.
- 호스트가 `POST /missions {templateId}` 호출 시 해당 모임의 missions row로 복사 (content 복사, FK 참조 X).

---

# (10-B) mission_assignments (미션 ↔ 참가자 배정)

- 발송 시 호스트가 등록한 미션을 참가자에게 N:M으로 배정하는 매핑 테이블.

| key                | type      | description                                  |
| ------------------ | --------- | -------------------------------------------- |
| **id**             | String    | **PK (ulid)**                                |
| **mission_id**     | String    | 배정된 미션 (FK → missions, cascade)         |
| **participant_id** | String    | 미션을 받은 참가자 (FK → participants, cascade) |
| **assigned_at**    | DateTime  | 배정 시각                                    |
| **completed_at**   | DateTime? | 완료 시각 (V1.1+에서 사용)                   |

- Unique: `(mission_id, participant_id)` — 같은 미션을 같은 참가자에게 중복 배정 금지.
- 재배정: 기존 배정 모두 삭제 후 다시 INSERT.
- 호스트는 배정 대상에서 제외 (GUEST만).
- `completed_at` 컬럼은 V1.0에서 미사용, API 응답에 노출하지 않음.

---

# (13) participantLocations (위치)

| key                | type     | description                   |
| ------------------ | -------- | ----------------------------- |
| **id**             | String   | **PK**                        |
| **invitation_id**  | String   | 초대장 고유 id                |
| **participant_id** | String   | **FK (위치를 공유하는 유저)** |
| **accuracy**       | Float    | 정확도 (위치 신뢰도)          |
| **lat**            | Float    | 위도 (Double 권장)            |
| **lng**            | Float    | 경도 (Double 권장)            |
| **is_arrived**     | boolean  | true - 도착 및 위치 공유 종료 |
| false - 이동 중    |
| **created_at**     | DateTime | 이동 경로 파악용(로그용)      |
| **updated_at**     | DateTime | 최신 위치 판별용              |

---

# (11) InvitationTemplate — 초대장 디자인 템플릿(샘플데이터)

| key                   | type     | description               |
| --------------------- | -------- | ------------------------- |
| **id**                | String   | PK (ulid)                 |
| **name**              | String   | 템플릿 이름               |
| **preview_image_key** | String   | 미리보기 이미지 S3 key    |
| **theme**             | String   | 기본 테마                 |
| **font**              | String   | 기본 폰트                 |
| **effect**            | String?  | 기본 효과                 |
| **is_active**         | Boolean  | 노출 여부 (default: true) |
| **created_at**        | DateTime | 생성일                    |
| **updated_at**        | DateTime | 수정일                    |

---

# **(12) eventLocations (모임장소저장)**

| key            | type   | description                |
| -------------- | ------ | -------------------------- |
| **id**         | String | PK (ulid)                  |
| invitation_id  | String | FK → invitation            |
| address        | String | 주소                       |
| place_name     | String | 장소명                     |
| detail_address | String | 세부 장소                  |
| lat            | Float  | 위도                       |
| lng            | Float  | 경도                       |
| place_id       | String | `카카오/구글 장소 고유 ID` |
