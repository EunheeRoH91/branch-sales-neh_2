# 제품 요구사항 문서 (PRD): 하루살림 리뷰 분석기

## 1. 프로젝트 개요 (Background & Objectives)
- **배경**: 생활가전 쇼핑몰 '하루살림'의 무선 청소기 '클린핏 미니'의 리뷰(현재 평균 3점대)에 대해 신속하고 일관성 있는 원인 파악 필요.
- **해결 과제**:
  - 기존 수작업(인턴 엑셀 수동 분류)으로 인한 시간 소모(2일) 해소.
  - 분석자별 기준 불일치 문제를 해결하여 매월 동일하고 객관적인 기준으로 리뷰를 자동 분류.
  - "충전기가 뜨겁다"와 같은 안전 모니터링 키워드를 감지하고, 한국소비자원에 접수된 청소기 위해 사고 통계와 비교 분석하여 제품 개선 및 소비자 안전에 선제적으로 대응.

---

## 2. 타겟 사용자 (Target Audience)
- **주 사용자**: 하루살림 마케팅팀 (개발 지식이 없는 비개발자 실무자)
- **사용 시나리오**: 리뷰 데이터 파일(CSV 등)을 화면에 업로드하여 AI 분석 결과 및 위해 통계를 확인하고, 원인 파악 및 보고서 작성에 즉시 활용.

---

## 3. 기능 요구사항 (Functional Requirements)

### 3.1. 리뷰 파일 업로드 및 AI 통합 분석
- **파일 업로드**: 사용자가 리뷰 데이터 파일을 업로드하면 전체 리뷰를 단 1회의 요청(Batch 통합 요청)으로 Gemini API에 전송하여 분석.
- **분석 모델 사양**:
  - 기본 모델: `gemini-3.8-flash` (무료 등급 기준)
  - Fallback 및 재시도: `503(Service Unavailable / 요청 몰림)` 에러 발생 시 `gemini-3.5-flash-lite` 모델로 **딱 1회만 재시도**.
  - 화면 표시: 분석 완료 후 화면에 실제 응답을 반환한 모델 이름(`model_used`)을 명시.
- **AI 프롬프트 분석 기준 (기준표 100% 엄격 적용)**:
  1. **감성 (sentiment)**: `긍정` / `부정` / `중립` / `광고`
     - 별점이 아닌 **리뷰 본문의 실제 문맥과 의미**로 판단 (반어법은 `부정` 처리).
     - 체험단, 원고료, 무상 제공, 할인 링크 등이 포함된 경우 `광고`로 분류하고 통계 집계에서 제외.
     - 칭찬과 불만이 혼재된 경우 더 강한 쪽으로 분류하며, 비중이 유사하면 `중립` 처리.
  2. **유형 (categories)**: 아래 카테고리 중 분류 (주제가 2개 이상이면 모두 기재)
     - `배터리`, `흡입력`, `소음`, `무게·사용감`, `디자인`, `관리·청소`, `구성품`, `품질·불량`, `배송`, `포장`, `고객센터`, `가격`, `설명서`, `기타`
  3. **핵심 요소 별도 추출**:
     - **개선 요청 (`improvement_request`)**: "~면 좋겠어요", "~해 주세요" 등의 건의 사항 문구 추출.
     - **안전 이슈 (`is_safety_issue`)**: `뜨거움`, `냄새`, `연기`, `감전` 등 과열/화재/감전 관련 언급 시 무조건 True(`true`)로 플래그 처리 및 표시.

### 3.2. 한국소비자원 소비자 위해 정보 연동
- **연동 API**: 공공데이터포털 한국소비자원 위해정보접수 API (`https://apis.data.go.kr/B551919/open-api/harm/reception`)
- **요청 파라미터**: `serviceKey`, `pageNo`, `numOfRows`, `apiFormat=json` (4개 필수/규정 파라미터만 전송)
- **데이터 처리 로직**:
  - API 자체 품목 필터 기능이 없으므로, 서버에서 1,000건씩 3페이지(총 3,000건)를 수신.
  - 수신된 데이터 중 `itemMinor` 필드가 **"가정용 진공청소기"**인 데이터만 애플리케이션 서버에서 자체 필터링.
- **화면 표시**:
  - 필터링된 데이터 중 `injuryReason`(위해 원인)별 발생 건수 1~3위를 집계하여 AI 분석 결과 화면 옆에 나란히 비교 표시.
- **캐싱 정책**:
  - 공공데이터 호출 부하 및 속도 개선을 위해 조회 결과를 **24시간(1일) 동안 서버 캐싱**하여 중복 호출 방지.

### 3.3. Supabase 데이터베이스 연동 및 히스토리 조회
- **저장 대상 테이블**: `review_analysis` (PostgreSQL / Supabase)
- **저장 단위**: 분석된 리뷰 1건당 1개 Row로 일괄 Insert.
- **저장 컬럼 규격**:
  - `analyzed_on` (date): 분석 수행 일자 (기본값: 오늘)
  - `review_no` (integer): 리뷰 고유 번호 / 순번
  - `written_on` (text): 원본 작성일
  - `rating` (integer): 원본 별점
  - `review_text` (text): 원본 리뷰 본문
  - `sentiment` (text): 감성 분석 결과 (`긍정`/`부정`/`중립`/`광고`)
  - `categories` (text): 유형 분류 결과
  - `improvement_request` (text): 추출된 개선 요청 문구
  - `is_safety_issue` (boolean): 안전 이슈 플래그 (true/false)
  - `model_used` (text): 분석에 사용된 AI 모델명
- **히스토리 조회**:
  - 메인 화면 하단에 기존 저장된 분석 결과 요약(분석일자별 전체 분석 건수, 부정 리뷰 비율)을 목록 형태로 표출.

### 3.4. 수동 입력 영역 제공
- 마케팅팀 담당자가 분석 결과와 위해 통계를 검토한 후 실행 방안을 작성할 수 있도록 **"우리가 고칠 것" 3줄 텍스트 입력창** 제공.
- AI가 임의로 자동 작성하지 않으며 순수 사용자 입력값으로 동작.

### 3.5. 예외 및 오류 처리
- 공공 API 호출 실패 또는 AI 응답 비어있음(Empty Response) 발생 시:
  - 별점을 기반으로 긍/부정을 유추하거나 가짜 숫자/데이터를 임의로 채우는 일(Hallucination) 절대 금지.
  - 데이터 누락 또는 통신 실패 시 화면에 **"불러오지 못했습니다"**라고 명확한 텍스트로 표출.

---

## 4. 비기능 및 제외 범위 (Out of Scope & Constraints)
1. **데이터 수정/삭제 기능 배제**: 화면상에서 과거 저장된 분석 데이터를 수정(`UPDATE`)하거나 삭제(`DELETE`)하는 UI 및 기능은 일체 제작하지 않음.
2. **AI 자동화 제한**: "우리가 고칠 것" 결론 3줄은 AI 자동 생성 대상이 아니며 수동 작성만 허용.
3. **더미 데이터 조작 금지**: 개발/테스트 과정에서 Supabase DB에 임의의 Dummy 데이터를 삽입하거나 임의 삭제하지 않음 (실제 화면 워크플로를 통해서만 검증).
4. **추론/임의 보정 금지**: 데이터 누락 시 별점 기반 임의 판정이나 가상 데이터 주입 금지.
5. **로컬 데이터 하드코딩 금지**: 로컬 파일 시스템의 예시 데이터('data' 폴더 등)를 소스코드 내 프리셋 버튼이나 정적 데이터로 하드코딩하여 포함하지 않음.

---

## 5. 기술 스택 및 보안/배포 가이드라인

### 5.1. 기술 스택
- **Framework**: Next.js (App Router 권장)
- **Database / BaaS**: Supabase PostgreSQL (`review_analysis` 테이블, RLS 활성화)
- **AI Engine**: Google Gemini API (`gemini-3.8-flash` & `gemini-3.5-flash-lite`)
- **External API**: 공공데이터포털 한국소비자원 위해정보접수 API
- **Deployment**: GitHub Repository 연동 및 Vercel 배포

### 5.2. 환경 변수 및 보안 원칙
- **`.gitignore` 준수**:
  - `.env.local` 및 로컬 테스트/참고 데이터 폴더('data' 폴더 등)는 `.gitignore`에 등록하여 GitHub 저장소에 절대 유출되지 않도록 설정.
- **클라이언트 환경 변수**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 엔드포인트 URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Publishable (anon) 키만 사용 (**Secret/Service Role 키는 절대 클라이언트에 노출하지 않음**)
- **서버 전용 환경 변수 (Server-Side Only)**:
  - `GEMINI_API_KEY`: Gemini API 인증 키
  - `CONSUMER_SAFETY_API_KEY`: 공공데이터포털 API 인증 키
  - 위 2개 키는 절대로 `NEXT_PUBLIC_` 접두사를 붙이지 않으며, Next.js의 Route Handlers 또는 Server Actions를 통해서만 호출.
  - Gemini API 호출 시 API 키는 URL Query Parameter 방식이 아닌 HTTP Header(`x-goog-api-key`)에 담아 안전하게 전송.

---

## 6. 데이터베이스 테이블 스키마 (Supabase)

```sql
CREATE TABLE IF NOT EXISTS public.review_analysis (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    analyzed_on date DEFAULT CURRENT_DATE NOT NULL,
    review_no integer,
    written_on text,
    rating integer,
    review_text text,
    sentiment text,
    categories text,
    improvement_request text,
    is_safety_issue boolean DEFAULT false NOT NULL,
    model_used text
);

-- RLS 활성화 (보안 필수)
ALTER TABLE public.review_analysis ENABLE ROW LEVEL SECURITY;

-- 익명/인증 사용자 조회 및 삽입 정책 (수정/삭제 불가)
CREATE POLICY "Allow public read access"
ON public.review_analysis
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow public insert access"
ON public.review_analysis
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
```
