# SAM.gov 주한미군 입찰 정보 수집/분석 시스템 - Plan

## 1. 제품 비전

SAM.gov 데이터 기반으로 주한미군 입찰 기회를 선제적으로 발굴하고, 낙찰 데이터 분석을 통해 경쟁력 있는 입찰 전략 수립을 지원하는 인텔리전스 플랫폼

## 2. 사용자 페르소나

| 페르소나 | 역할 | 사용 빈도 | 핵심 니즈 |
|----------|------|-----------|-----------|
| 영업/사업개발 담당자 | Primary | 매일 | 맞춤 공고 알림, 빠른 검색/필터 |
| 경영진 | Secondary | 주 1~2회 | 분석 대시보드, 전략 인사이트 |
| 시스템 관리자 | Admin | 수시 | 수집 모니터링, 사용자/권한 관리 |

## 3. 성공 지표 (KPI)

- 한국 관련 공고 수집 커버리지 99%+
- 신규 공고 발생 후 1시간 내 알림 발송
- 수동 모니터링 대비 80% 시간 절감

## 4. 기술 스택

| 계층 | 기술 | 이유 |
|------|------|------|
| 프레임워크 | Next.js 15 (App Router) | SSR/SSG, Vercel 최적화, API Routes BFF |
| UI | shadcn/ui + Tailwind CSS + Geist | 빠른 엔터프라이즈 UI 구축 |
| DB | Supabase (PostgreSQL) | Auth/Storage/Realtime 통합, Vercel 연동 |
| ORM | Drizzle ORM | 타입 안전, 경량 |
| 캐싱 | Upstash Redis | Rate limit 카운터, 응답 캐싱 |
| 배포/호스팅 | Vercel | CI/CD, Cron, Edge Functions |
| 인증 | NextAuth.js v5 | Next.js 네이티브 통합 |
| 스케줄러 | Vercel Cron Jobs | 인프라 관리 불필요 |
| 알림 | Resend | Vercel 생태계 |
| 차트 | Recharts | React 네이티브, 커스터마이징 |
| 엑셀 | ExcelJS | 서버사이드 Excel 생성 |
| 배포 | Vercel | CI/CD 자동화 |

## 5. MVP 기능 (Phase 1)

### 핵심 기능
1. SAM.gov Opportunities API 자동 수집 (매시간 Cron)
2. Contract Awards API 수집 (일 1회)
3. 한국 관련 공고 필터링 후 DB 저장
4. 공고 목록/상세 조회 (검색, 필터, 정렬, 페이지네이션)
5. 맞춤 필터 생성/관리 (NAICS, 키워드, 공고유형)
6. 이메일 알림 (필터 매칭 시)
7. 대시보드 (신규, 마감 임박, 상태 요약)
8. 과거 낙찰 분석 (금액 분포, 경쟁사, 발주 패턴)
9. 사용자 인증 (이메일 로그인, 역할 기반)
10. 엑셀 내보내기
11. 관리자 페이지

### Phase 2 (이후)
- SMS/Slack 알림
- AI 공고 요약
- 팀 협업 기능
- 시스템 모니터링 고도화

## 6. 데이터 모델

### Opportunity (입찰 공고)
- noticeId (PK), title, solicitationNumber, naicsCode, department
- postedDate, responseDeadline, archiveDate
- placeOfPerformance (country, state, city)
- type (presolicitation, solicitation, award, etc.)
- status (active, closed, archived)
- setAside, classificationCode
- description, organizationType, officeAddress
- resourceLinks, pointOfContact
- rawData (JSONB)
- createdAt, updatedAt

### Award (낙찰 정보)
- id (PK), contractNumber, opportunityId (FK)
- awardeeName, awardeeUei, awardAmount
- dateSigned, naicsCode, psc
- contractType, fundingAgency, fundingOffice
- rawData (JSONB)
- createdAt

### User (사용자)
- id (PK), email, name, passwordHash
- role (admin | user), isActive
- createdAt, updatedAt, lastLoginAt

### UserFilter (맞춤 필터)
- id (PK), userId (FK), name
- naicsCodes (text[]), keywords (text[])
- noticeTypes (text[]), setAsides (text[])
- isActive, notifyEmail
- createdAt, updatedAt

### Notification (알림)
- id (PK), userId (FK), opportunityId (FK), filterId (FK)
- channel (email | sms | slack)
- status (pending | sent | failed)
- sentAt, createdAt

### SyncLog (수집 로그)
- id (PK), apiType (opportunities | awards)
- status (running | success | failed)
- recordsFetched, recordsNew, recordsUpdated
- errorMessage, duration
- startedAt, completedAt

## 7. SAM.gov API 연동 전략

### API 엔드포인트
- Opportunities: `https://api.sam.gov/prod/opportunities/v2/search?api_key=KEY`
- Awards: `https://api.sam.gov/prod/contract-awards/v1/search?api_key=KEY`

### Rate Limit 관리 (1,000 req/day)
- Redis로 일일 사용량 카운터 관리
- 매시간 증분 수집 (~30 req) + 일 1회 전체 확인 (~100 req)
- 동일 쿼리 1시간 TTL 캐싱

### 한국 필터링 전략 (API에 국가 필터 없음)
1. 키워드 기반 1차: `Korea, USFK, Camp Humphreys, Osan, Kunsan` 등
2. NAICS 코드 기반: USFK 주요 발주 코드 사전 정의
3. 기관 코드 기반: DoD 산하 USFK 관련 조직
4. 응답 후 서버사이드 필터: `placeOfPerformance.country === "KOR"`

### Cron 설정
```json
{
  "crons": [
    { "path": "/api/cron/sync-opportunities", "schedule": "0 * * * *" },
    { "path": "/api/cron/sync-awards", "schedule": "0 6 * * *" },
    { "path": "/api/cron/check-deadlines", "schedule": "0 0 * * *" }
  ]
}
```

## 8. 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/login, register
│   ├── (dashboard)/
│   │   ├── page.tsx (대시보드)
│   │   ├── opportunities/ (공고 목록/상세)
│   │   ├── awards/ (낙찰 분석, 경쟁사)
│   │   ├── filters/ (맞춤 필터)
│   │   ├── notifications/ (알림 설정)
│   │   └── admin/ (사용자, 설정, 모니터링)
│   └── api/cron/ (수집 Cron)
├── components/
│   ├── ui/ (shadcn)
│   ├── layout/ (sidebar, header)
│   ├── opportunities/ (공고 관련)
│   ├── awards/ (낙찰 분석)
│   └── charts/ (차트 컴포넌트)
├── lib/
│   ├── db/schema.ts (Drizzle)
│   ├── sam-api/ (API 클라이언트)
│   └── services/ (sync, notification, filter-matching, analytics)
└── types/
```

## 9. MVP 화면 목록

| 화면 | 라우트 | 설명 |
|------|--------|------|
| 로그인 | `/login` | 이메일/비밀번호 로그인 |
| 대시보드 | `/` | 오늘의 요약, 신규 공고, 마감 임박 |
| 공고 목록 | `/opportunities` | 검색/필터/정렬/페이지네이션 |
| 공고 상세 | `/opportunities/[id]` | 공고 전체 정보, 관련 낙찰 |
| 낙찰 분석 | `/awards` | 금액 분포, 발주 패턴 차트 |
| 경쟁사 분석 | `/awards/competitors` | 업체별 낙찰 현황, 점유율 |
| 내 필터 | `/filters` | 맞춤 필터 CRUD |
| 알림 설정 | `/notifications` | 알림 이력, 채널 설정 |
| 관리자 | `/admin/users` | 사용자 관리, 시스템 설정 |

## 10. 리스크 및 완화

| 리스크 | 완화 |
|--------|------|
| API Rate Limit 초과 | Redis 카운터 + 캐싱 + 시스템 계정 신청 |
| 국가 필터 부재 | 다중 키워드 + 서버사이드 필터 |
| API Key 90일 만료 | 만료 14일 전 알림 + 관리자 UI 키 업데이트 |
| SAM.gov API 장애 | Exponential backoff + SyncLog 감지 |
| Vercel Cron 시간 제한 | 수집 분할 실행 설계 |

## 11. 예상 인프라 비용

월 $20~60 (Vercel Pro + Supabase + Upstash + Resend)

## 12. 구현 단계 및 코드 리뷰

각 단계 완료 후 반드시 코드 리뷰를 수행한다.

| 단계 | 내용 | 코드 리뷰 항목 |
|------|------|----------------|
| Step 1 | 목업 화면 제작 | UI 일관성, 접근성, 반응형 레이아웃 |
| Step 2 | DB 스키마 + Supabase 연동 | 인덱스 설계, 타입 안전성, 마이그레이션 |
| Step 3 | SAM.gov API 클라이언트 | Rate limit 처리, 에러 핸들링, 재시도 로직 |
| Step 4 | Cron + 수집 서비스 | 멱등성, 로깅, 장애 복구 |
| Step 5 | 인증 (NextAuth + Supabase) | 보안, 세션 관리, RBAC |
| Step 6 | 공고 목록/상세 API + UI 연동 | 쿼리 최적화, 페이지네이션, 캐싱 |
| Step 7 | 맞춤 필터 + 알림 서비스 | 필터 매칭 정확도, 이메일 전송 안정성 |
| Step 8 | 낙찰 분석 대시보드 | 차트 성능, 데이터 집계 쿼리 |
| Step 9 | 관리자 + 엑셀 내보내기 | 권한 검증, 대용량 처리 |
| Step 10 | 통합 테스트 + 배포 | E2E 시나리오, 환경변수, Vercel 설정 |

### 코드 리뷰 기준
- 보안: XSS, SQL Injection, 인증 우회
- 성능: N+1 쿼리, 불필요한 리렌더링
- 타입 안전성: any 사용 금지, strict 모드
- 에러 처리: 사용자 친화적 에러 메시지
- 코드 품질: 중복 제거, 단일 책임 원칙
