# WARA 사진(Photos) 기능 구현 가이드

## 기술 스택

백엔드는 NestJS + Drizzle ORM + PostgreSQL 조합으로 구성하며, 파일 저장은 AWS S3를 사용한다.
S3 업로드/다운로드는 Presigned URL 방식으로 처리하며, 관련 패키지는 @aws-sdk/client-s3와 @aws-sdk/s3-request-presigner를 사용한다.
EXIF 메타데이터 추출은 프런트에서 exifreader 또는 exifr 라이브러리를 사용한다.

---

## 스키마 구조

### photos 테이블

사진 정보를 저장하는 메인 테이블이다. 참여자(participant)와 초대장(invitation)에 각각 연결되며, 둘 중 하나가 삭제되면 같이 삭제된다.

저장하는 정보는 다음과 같다.
- imageKey: S3에 저장된 파일의 경로(키). URL 전체가 아닌 경로만 저장한다.
- takenAt: EXIF에서 추출한 실제 촬영 시간. 정렬 성능을 위해 jsonb가 아닌 별도 컬럼으로 분리한다.
- exifMetadata: 촬영 위치(gps_lat, gps_lng, gps_address)를 jsonb로 저장한다. 정렬에 사용하지 않으므로 jsonb로 충분하다.
- viewCount: 조회수. 0 이상이어야 한다.
- likeCount: 좋아요 수. 0 이상이어야 한다.
- feedbackCount: 사진 낱개에 달린 피드백 수. 0 이상이어야 한다. Best 9 점수 산정에 사용된다.
- deletedAt: soft delete용 컬럼. 삭제 시 이 값을 업데이트하며 실제 DB에서 row를 지우지 않는다.

인덱스는 두 가지를 사용한다. invitationId + takenAt 복합 인덱스는 촬영 시간순 정렬에 사용하고, deletedAt 인덱스는 soft delete 필터링에 사용한다.

### photoLikes 테이블

사진 좋아요 정보를 저장한다. 같은 참여자가 같은 사진에 중복으로 좋아요를 누르지 못하도록 photoId + participantId 조합에 unique 제약을 건다.

### feedbacks 테이블

초대장 전체 피드백과 사진 낱개 피드백을 하나의 테이블에서 관리한다.
- invitationId만 있고 photoId가 null이면 초대장 전체 피드백이다.
- invitationId와 photoId가 둘 다 있으면 사진 낱개 피드백이다.
- parentId가 있으면 대댓글이다.
- invitationId와 photoId 중 하나는 반드시 있어야 한다는 제약 조건이 있다.

---

## 피드백(댓글) 동기화 구조

프런트에는 두 가지 피드백 진입점이 있다.

첫 번째는 초대장 전체 피드백 탭이다. 이 탭에서는 invitationId를 기준으로 피드백을 조회하기 때문에, 사진에 달린 피드백도 invitationId가 같으면 자동으로 포함된다. 별도의 동기화 로직이 필요하지 않다.

두 번째는 사진 상세 페이지다. 여기서는 photoId를 기준으로 조회하기 때문에 해당 사진에 달린 피드백만 보인다.

즉, 사진에 피드백을 달면 invitationId와 photoId가 둘 다 저장되므로, 전체 탭과 사진 상세 페이지 양쪽에서 자동으로 보인다.

사진 낱개 피드백을 생성하거나 삭제할 때는 photos 테이블의 feedbackCount도 함께 업데이트해야 한다. 이때 반드시 원자적으로 처리해야 한다. 조회 후 +1 하는 방식은 동시 요청에서 틀릴 수 있으므로 SQL로 직접 증감 처리한다.

---

## 핵심 비즈니스 규칙

### 해야 하는 것

- 업로드와 다운로드는 초대장 참여자만 가능하다. 서비스 레이어에서 반드시 검증해야 한다.
- Presigned URL 만료시간은 5분(300초)으로 고정한다.
- imageKey는 S3 경로(키)만 저장한다. 전체 URL을 저장하면 나중에 도메인이 바뀔 때 대응이 어렵다.
- 다운로드 시 원본 파일을 그대로 제공한다. 압축하거나 변환하지 않는다.
- 목록 조회 시 항상 deletedAt IS NULL 조건을 포함한다.
- 전체 다운로드는 비동기로 처리하고 완료 시 알림을 보낸다.
- 삭제는 soft delete로 처리한다. S3 파일 실제 삭제는 배치 작업으로 별도 처리한다.
- 사진 피드백 생성/삭제 시 feedbackCount를 원자적으로 업데이트한다.
- GPS 정보가 포함된 사진 업로드 시 사용자에게 사전 고지한다.
- 역지오코딩(gps_address)은 필요할 때만 호출한다. 카카오 API 기준 월 30만 건까지 무료이며, 업로드마다 자동 호출하면 비용이 발생한다.

### 하면 안 되는 것

- 비참여자에게 Presigned URL을 발급하지 않는다.
- imageKey에 S3 전체 URL을 저장하지 않는다.
- 다운로드 시 파일을 압축하거나 변환하지 않는다.
- 삭제 즉시 S3 파일을 삭제하지 않는다. soft delete 후 배치로 처리한다.
- deletedAt IS NULL 조건 없이 목록을 조회하지 않는다.
- 역지오코딩을 업로드마다 자동 호출하지 않는다.
- GIF 파일 업로드를 허용하지 않는다. GIF는 EXIF 데이터가 없어 촬영 시간과 위치 정보를 추출할 수 없다.
- feedbackCount를 비원자적으로 업데이트하지 않는다.

---

## API 엔드포인트

사진 관련 엔드포인트는 다음과 같다.
- Presigned URL 발급, 업로드 완료 후 DB 저장, 목록 조회, 단건 조회, 낱개 다운로드 URL 발급, 전체 다운로드(비동기), 좋아요/좋아요 취소, 삭제(soft delete)

피드백 관련 엔드포인트는 다음과 같다.
- 초대장 전체 피드백 조회/작성, 사진 낱개 피드백 조회/작성, 피드백 삭제(soft delete)

모든 엔드포인트는 /invitations/:invitationId 하위에 위치한다.

---

## 업로드 허용 파일 타입

EXIF 데이터를 추출할 수 있는 파일 타입만 허용한다.
- image/jpeg (.jpg, .jpeg)
- image/png (.png)
- image/webp (.webp)
- image/heic (.heic, 아이폰 기본 포맷)
- image/heif (.heif, 아이폰 기본 포맷)

GIF는 EXIF 데이터가 없으므로 허용하지 않는다.
jpg와 jpeg는 확장자만 다를 뿐 contentType은 동일하게 image/jpeg로 전달된다.

---

## EXIF 추출 흐름

클라이언트에서 사진을 선택하면 S3에 업로드하기 전에 EXIF를 먼저 추출한다. 추출한 값은 Presigned URL로 S3에 업로드한 뒤, imageKey + takenAt + exifMetadata를 서버에 함께 전송하여 DB에 저장한다.

takenAt은 촬영 시간이 없는 사진(스크린샷 등)의 경우 null이 될 수 있다. null인 사진은 takenAt 기준 정렬 시 맨 뒤로 보낸다.

역지오코딩(gps_address)은 업로드 시점에 자동으로 호출하지 않는다. 필요한 시점에만 호출한다.

---

## 정렬 방식

사진 목록은 두 가지 기준으로 정렬할 수 있다.
- createdAt: DB에 저장된 시간 기준. 기본값이다.
- takenAt: 실제 촬영 시간 기준. takenAt이 없는 사진은 맨 뒤로 보낸다.

페이지네이션은 cursor 방식을 사용한다. 무한 스크롤 UI에 적합하며, 마지막으로 받은 photoId를 cursor로 넘기면 그 다음 항목부터 가져온다.

---

## 리마인드 앨범 (Best 9) 점수 산정

각 사진의 점수는 조회수, 좋아요 수, 피드백 수를 가중치를 적용해 합산한다.
- 조회 1회당 0.5점
- 좋아요 1개당 1.0점
- 피드백 1개당 1.5점

점수가 높은 순서로 9장을 선별해 리마인드 앨범을 구성한다.
feedbackCount는 사진 낱개에 달린 피드백 수만 반영하며, 초대장 전체 피드백은 포함하지 않는다.

---

## 낙관적 업데이트

좋아요 기능에 낙관적 업데이트를 적용한다. 서버 응답을 기다리지 않고 UI를 먼저 업데이트한 뒤, 요청이 실패하면 이전 상태로 롤백한다. 성공/실패 관계없이 최종적으로는 서버 데이터와 동기화한다. TanStack Query의 onMutate, onError, onSettled를 활용한다.

---
