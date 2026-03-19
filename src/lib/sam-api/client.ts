const SAM_BASE_URL = "https://api.sam.gov/opportunities/v2";

const RETRYABLE_STATUS = [429, 500, 502, 503, 504];
const MAX_RETRIES = 3;

function getApiKey(): string {
  const key = process.env.SAM_GOV_API_KEY;
  if (!key) throw new Error("SAM_GOV_API_KEY 환경변수가 설정되지 않았습니다.");
  return key;
}

export interface SamSearchParams {
  postedFrom?: string; // MM/dd/yyyy
  postedTo?: string;
  keyword?: string;
  naicsCode?: string;
  typeOfSetAside?: string;
  noticeType?: string;
  placeOfPerformanceCode?: string; // 국가코드 (예: KOR)
  limit?: number; // max 1000
  offset?: number;
  orderBy?: string;
}

export interface SamOpportunityResponse {
  totalRecords: number;
  limit: number;
  offset: number;
  opportunitiesData: SamOpportunity[];
}

export interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  fullParentPathName?: string;
  department?: string;
  subTier?: string;
  office?: string;
  postedDate: string;
  type: string;
  baseType: string;
  archiveType?: string;
  archiveDate?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  classificationCode?: string;
  active: string;
  description?: string;
  organizationType?: string;
  uiLink?: string;
  award?: {
    date?: string;
    number?: string;
    amount?: string;
    awardee?: {
      name?: string;
      ueiSAM?: string;
      location?: { city?: string; state?: string; country?: string; zip?: string };
    };
  };
  pointOfContact?: Array<{
    type?: string;
    title?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  }>;
  placeOfPerformance?: {
    city?: { name?: string };
    state?: { code?: string; name?: string };
    country?: { code?: string; name?: string };
    zip?: string;
  };
  resourceLinks?: string[];
  setAside?: string;
  setAsideDescription?: string;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function samFetch<T>(url: string, params: Record<string, string>): Promise<T> {
  const searchParams = new URLSearchParams(params);
  searchParams.set("api_key", getApiKey());

  const fullUrl = `${url}?${searchParams.toString()}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(fullUrl, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "60", 10);
        if (attempt < MAX_RETRIES) {
          await sleep(retryAfter * 1000);
          continue;
        }
        throw new Error("SAM.gov API Rate Limit 초과 (1,000 req/day)");
      }

      if (RETRYABLE_STATUS.includes(res.status) && attempt < MAX_RETRIES) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`SAM.gov API 에러 (${res.status}): ${text.slice(0, 200)}`);
      }

      return res.json() as Promise<T>;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        throw new Error("SAM.gov API 타임아웃 (30초 초과)");
      }
      if (attempt === MAX_RETRIES) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("SAM.gov API 최대 재시도 횟수 초과");
}

export async function searchOpportunities(
  params: SamSearchParams = {}
): Promise<SamOpportunityResponse> {
  const searchParams: Record<string, string> = {
    limit: String(params.limit ?? 25),
    offset: String(params.offset ?? 0),
  };

  if (params.postedFrom) searchParams.postedFrom = params.postedFrom;
  if (params.postedTo) searchParams.postedTo = params.postedTo;
  if (params.keyword) searchParams.keyword = params.keyword;
  if (params.naicsCode) searchParams.naicsCode = params.naicsCode;
  if (params.typeOfSetAside) searchParams.typeOfSetAside = params.typeOfSetAside;
  if (params.noticeType) searchParams.ncode = params.noticeType;
  if (params.orderBy) searchParams.orderBy = params.orderBy;
  if (params.placeOfPerformanceCode) searchParams.placeOfPerformanceCode = params.placeOfPerformanceCode;

  return samFetch<SamOpportunityResponse>(`${SAM_BASE_URL}/search`, searchParams);
}

export async function getOpportunityById(noticeId: string): Promise<SamOpportunity | null> {
  try {
    const res = await samFetch<SamOpportunityResponse>(`${SAM_BASE_URL}/search`, {
      noticeid: noticeId,
      limit: "1",
      offset: "0",
    });
    return res.opportunitiesData?.[0] ?? null;
  } catch (error) {
    console.warn(`[SAM API] getOpportunityById(${noticeId}) 실패:`, error);
    return null;
  }
}

const KOREA_KEYWORDS = [
  "Korea", "USFK", "Camp Humphreys", "Osan", "Kunsan",
  "Yongsan", "Camp Casey", "Camp Walker", "Chinhae",
  "Daegu", "USAG", "K-16", "Pyeongtaek",
];

// 2단계 수집: 1) placeOfPerformance=KOR, 2) 키워드 기반 (보충)
export async function searchKoreaOpportunities(
  params: Omit<SamSearchParams, "keyword" | "placeOfPerformanceCode"> = {}
): Promise<SamOpportunityResponse> {
  // 1차: 수행지역 한국 필터 (가장 정확)
  const byPlace = await searchOpportunities({
    ...params,
    placeOfPerformanceCode: "KOR",
  });

  // 2차: 키워드 기반 보충 수집 (수행지역 미지정 공고 포착)
  const keyword = KOREA_KEYWORDS.join(" OR ");
  const byKeyword = await searchOpportunities({ ...params, keyword });

  // 중복 제거 후 병합
  const seen = new Set(byPlace.opportunitiesData.map((o) => o.noticeId));
  const merged = [...byPlace.opportunitiesData];
  for (const opp of byKeyword.opportunitiesData) {
    if (!seen.has(opp.noticeId)) {
      merged.push(opp);
      seen.add(opp.noticeId);
    }
  }

  return {
    totalRecords: merged.length,
    limit: params.limit ?? 1000,
    offset: params.offset ?? 0,
    opportunitiesData: merged,
  };
}

export function isKoreaRelated(opp: SamOpportunity): boolean {
  const country = opp.placeOfPerformance?.country?.code;
  if (country === "KOR" || country === "KR") return true;

  const searchText = [
    opp.title, opp.description,
    opp.placeOfPerformance?.city?.name,
    opp.placeOfPerformance?.state?.name,
    opp.office, opp.department,
  ].filter(Boolean).join(" ").toUpperCase();

  return KOREA_KEYWORDS.some((kw) => searchText.includes(kw.toUpperCase()));
}
