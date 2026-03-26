# Phase 2 Plan: 모니터링 대시보드 고도화 + SMS/Slack 알림 연동

> 작성일: 2026-03-26
> 상태: Plan 완료, 구현 대기

## Context

Phase 1 MVP가 완료된 상태. SAM.gov 공고 수집, AI 분석, 이메일 알림, 낙찰 분석 등 핵심 기능이 모두 동작 중.
Phase 2에서는 **운영 가시성 강화(모니터링)** 와 **알림 채널 확장(SMS/Slack)** 을 구현한다.

---

## 1. 모니터링 대시보드 고도화

### 현재 상태
- `syncLogs` 테이블에 수집 로그 저장 중 (apiType, status, duration, recordsFetched 등)
- `/admin/sync` 페이지에 텍스트 기반 로그 목록만 표시
- `getSystemStats()` 함수로 기본 통계 조회 가능 (`src/lib/services/admin.ts`)

### 구현 항목

#### 1-1. 수집 현황 차트 (Recharts 활용)
- **파일**: `src/app/(dashboard)/admin/sync/page.tsx` 수정
- 일별/주별 수집 건수 추이 (Bar Chart)
- API별(SAM/Awards/USAspending) 성공/실패 비율 (Pie Chart)
- 평균 수집 소요시간 추이 (Line Chart)
- 데이터 소스: `syncLogs` 테이블 집계 쿼리

#### 1-2. 시스템 통계 대시보드
- **파일**: `src/app/(dashboard)/admin/page.tsx` 신규 생성
- 총 공고/낙찰/사용자 수 카드
- 최근 24시간 신규 공고 수
- API Rate Limit 잔여량 (Redis 카운터 조회)
- 마지막 성공 수집 시각

#### 1-3. 사용자 활동 로그
- **스키마 추가**: `activityLogs` 테이블 (`src/lib/db/schema.ts`)
  - userId, action (login/filter_create/export/etc), metadata (JSONB), createdAt
- **서비스**: `src/lib/services/activity-log.ts` 생성
- **UI**: `/admin/users` 페이지에 활동 로그 탭 추가

#### 1-4. API 사용량 추적
- SAM.gov API 일일 사용량 카운터 시각화
- 일일 한도(1,000 req) 대비 사용률 Progress Bar
- 데이터 소스: Redis 또는 syncLogs 기반 계산

---

## 2. SMS/Slack 알림 연동

### 현재 상태
- `notifications` 테이블에 `channel` 컬럼 존재 (email/sms/slack)
- `userFilters` 테이블에 `notifyEmail` 필드만 있음
- 실제 발송은 이메일만 구현 (`matchFiltersAndNotify` → Resend)

### 구현 항목

#### 2-1. Slack Webhook 연동
- **파일**: `src/lib/services/slack-notify.ts` 신규
- Slack Incoming Webhook URL을 환경변수로 관리 (`SLACK_WEBHOOK_URL`)
- Block Kit 메시지 포맷 (공고 제목, 마감일, SAM.gov 링크 포함)
- 사용자별 Slack 알림 on/off 설정

#### 2-2. SMS 연동 (Twilio)
- **파일**: `src/lib/services/sms-notify.ts` 신규
- Twilio API 연동 (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)
- 간결한 SMS 템플릿 (160자 제한 고려)
- 사용자별 전화번호 + SMS 알림 on/off 설정

#### 2-3. 알림 채널 통합
- **수정**: `src/lib/services/notifications.ts`
  - `matchFiltersAndNotify()` 함수에 채널별 분기 추가
  - email/slack/sms 각 채널로 병렬 발송
- **스키마 수정**: `userFilters` 테이블에 `notifySlack`, `notifySms` 필드 추가
- **스키마 수정**: `users` 테이블에 `phone` 필드 추가

#### 2-4. 알림 설정 UI
- **수정**: `src/app/(dashboard)/filters/page.tsx`
  - 필터별 알림 채널 선택 UI (체크박스: Email/Slack/SMS)
- **수정**: `src/app/(dashboard)/notifications/page.tsx`
  - 채널별 발송 이력 필터링
  - Slack/SMS 연결 상태 표시

---

## 3. 구현 순서

| 단계 | 내용 | 주요 파일 |
|------|------|-----------|
| Step 1 | DB 스키마 마이그레이션 (activityLogs, users.phone, userFilters 알림 필드) | `src/lib/db/schema.ts` |
| Step 2 | 모니터링 차트 컴포넌트 + 집계 쿼리 | `src/app/(dashboard)/admin/sync/page.tsx` |
| Step 3 | 시스템 통계 대시보드 | `src/app/(dashboard)/admin/page.tsx` |
| Step 4 | Slack Webhook 발송 서비스 | `src/lib/services/slack-notify.ts` |
| Step 5 | SMS(Twilio) 발송 서비스 | `src/lib/services/sms-notify.ts` |
| Step 6 | 알림 채널 통합 (notifications.ts 수정) | `src/lib/services/notifications.ts` |
| Step 7 | 알림 설정 UI 업데이트 | `src/app/(dashboard)/filters/page.tsx` |
| Step 8 | 사용자 활동 로그 | `src/lib/services/activity-log.ts` |

---

## 4. 핵심 파일 목록

### 수정 대상
- `src/lib/db/schema.ts` — activityLogs 테이블, users.phone, userFilters 알림 필드
- `src/lib/services/notifications.ts` — 채널별 분기 발송
- `src/app/(dashboard)/admin/sync/page.tsx` — 차트 추가
- `src/app/(dashboard)/filters/page.tsx` — 알림 채널 설정 UI
- `src/app/(dashboard)/notifications/page.tsx` — 채널별 필터링

### 신규 생성
- `src/lib/services/slack-notify.ts`
- `src/lib/services/sms-notify.ts`
- `src/lib/services/activity-log.ts`
- `src/app/(dashboard)/admin/page.tsx` (시스템 통계)

### 재사용
- `src/lib/services/admin.ts` — `getSystemStats()` 확장
- `src/components/charts/` — 기존 Recharts 컴포넌트 패턴 활용
- Resend 이메일 발송 패턴 → Slack/SMS에 동일 구조 적용

---

## 5. 환경변수 추가

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...
```

---

## 6. 검증 방법

1. **모니터링**: `/admin/sync` 페이지에서 차트 렌더링 확인, 데이터 정합성 검증
2. **Slack**: 테스트 Webhook으로 메시지 발송 → Slack 채널에서 수신 확인
3. **SMS**: Twilio 테스트 번호로 SMS 발송 → 수신 확인
4. **통합**: 필터 생성 → 3개 채널 모두 활성화 → Cron 실행 → 각 채널 수신 확인
5. **활동 로그**: 로그인/필터 생성/내보내기 등 주요 액션 수행 후 `/admin` 로그 확인
