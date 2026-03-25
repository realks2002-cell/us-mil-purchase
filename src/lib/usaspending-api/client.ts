const USASPENDING_BASE_URL = "https://api.usaspending.gov/api/v2";

const RETRYABLE_STATUS = [429, 500, 502, 503, 504];
const MAX_RETRIES = 3;

export interface UsaspendingAwardResult {
  internal_id: number;
  "Award ID": string;
  "Recipient Name": string;
  "Recipient UEI": string;
  "Award Amount": number;
  "Total Outlays": number;
  Description: string;
  "Contract Award Type": string;
  "Award Type": string;
  "Start Date": string;
  "End Date": string;
  generated_internal_id: string;
  "Awarding Agency": string;
  "Awarding Sub Agency": string;
  "Funding Agency": string;
  "Funding Sub Agency": string;
  PIID: string | null;
  NAICS: string | { code: string; description: string } | null;
  PSC: string | { code: string; description: string } | null;
  "Place of Performance": string | null;
}

export interface UsaspendingSearchResponse {
  results: UsaspendingAwardResult[];
  page_metadata: {
    page: number;
    hasNext: boolean;
    total: number;
    limit: number;
  };
}

export interface UsaspendingAwardDetail {
  id: number;
  generated_unique_award_id: string;
  type: string;
  type_description: string;
  piid: string;
  description: string;
  total_obligation: number;
  base_and_all_options_value: number;
  date_signed: string;
  period_of_performance_start_date: string;
  period_of_performance_current_end_date: string;
  recipient: {
    recipient_name: string;
    recipient_uei: string;
    recipient_unique_id: string;
    parent_recipient_name: string;
    parent_recipient_uei: string;
    business_categories: string[];
    location: {
      country_code: string;
      city_name: string;
      state_code: string;
    };
  };
  place_of_performance: {
    country_code: string;
    country_name: string;
    city_name: string;
    state_code: string;
  };
  awarding_agency: {
    toptier_agency: { name: string };
    subtier_agency: { name: string };
  };
  funding_agency: {
    toptier_agency: { name: string };
    subtier_agency: { name: string };
  };
  naics: string;
  naics_description: string;
  psc_code: string;
  psc_description: string;
  type_of_set_aside: string;
  type_of_set_aside_description: string;
  extent_competed: string;
  extent_competed_description: string;
  number_of_offers_received: number;
  latest_transaction_contract_data?: {
    extent_competed: string;
    extent_competed_description: string;
    number_of_offers_received: string;
    type_of_set_aside: string;
    type_of_set_aside_description: string;
    naics: string;
    naics_description: string;
    product_or_service_code: string;
    product_or_service_co_desc: string;
  };
}

export interface UsaspendingCategoryResult {
  category: string;
  aggregated_amount: number;
  name: string;
  code: string;
  id: number | null;
}

export interface UsaspendingCategoryResponse {
  category: string;
  results: UsaspendingCategoryResult[];
  limit: number;
  page_metadata: { page: number; hasNext: boolean; total: number };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function usaspendingFetch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const url = `${USASPENDING_BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      });

      if (RETRYABLE_STATUS.includes(res.status) && attempt < MAX_RETRIES) {
        const retryAfter = res.status === 429
          ? parseInt(res.headers.get("Retry-After") || "5", 10)
          : Math.pow(2, attempt);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`USAspending API 에러 (${res.status}): ${text.slice(0, 200)}`);
      }

      return res.json() as Promise<T>;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        throw new Error("USAspending API 타임아웃 (30초 초과)");
      }
      if (attempt === MAX_RETRIES) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("USAspending API 최대 재시도 횟수 초과");
}

async function usaspendingGet<T>(endpoint: string): Promise<T> {
  const url = `${USASPENDING_BASE_URL}${endpoint}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });

      if (RETRYABLE_STATUS.includes(res.status) && attempt < MAX_RETRIES) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`USAspending API 에러 (${res.status}): ${text.slice(0, 200)}`);
      }

      return res.json() as Promise<T>;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        if (attempt < MAX_RETRIES) {
          await sleep(Math.pow(2, attempt) * 1000);
          continue;
        }
        throw new Error("USAspending API 타임아웃 (30초 초과)");
      }
      if (attempt === MAX_RETRIES) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error("USAspending API 최대 재시도 횟수 초과");
}

export interface SearchAwardsParams {
  dateType?: "action_date" | "last_modified_date";
  dateRange?: { start_date: string; end_date: string };
  awardType?: string[];
  country?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  naicsCodes?: string[];
  recipientId?: string;
}

export async function searchAwards(params: SearchAwardsParams = {}): Promise<UsaspendingSearchResponse> {
  const filters: Record<string, unknown> = {
    award_type_codes: params.awardType ?? ["A", "B", "C", "D"],
  };

  if (params.dateRange) {
    filters.time_period = [params.dateRange];
  }

  if (params.country) {
    filters.place_of_performance_locations = [{ country: params.country }];
  }

  if (params.naicsCodes && params.naicsCodes.length > 0) {
    filters.naics_codes = params.naicsCodes.map((code) => ({ naics_code: code }));
  }

  if (params.recipientId) {
    filters.recipient_id = params.recipientId;
  }

  return usaspendingFetch<UsaspendingSearchResponse>("/search/spending_by_award/", {
    filters,
    fields: [
      "Award ID", "Recipient Name", "Recipient UEI", "Award Amount",
      "Total Outlays", "Description", "Contract Award Type", "Award Type",
      "Start Date", "End Date", "Awarding Agency", "Awarding Sub Agency",
      "Funding Agency", "Funding Sub Agency", "PIID", "NAICS", "PSC",
      "Place of Performance",
    ],
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    sort: params.sort ?? "Award Amount",
    order: params.order ?? "desc",
    subawards: false,
  });
}

export async function getAwardDetail(awardId: string): Promise<UsaspendingAwardDetail> {
  return usaspendingGet<UsaspendingAwardDetail>(`/awards/${encodeURIComponent(awardId)}/`);
}

export async function searchByCategory(
  category: "awarding_agency" | "recipient" | "naics" | "psc",
  filters: Record<string, unknown>,
  page = 1,
  limit = 10,
): Promise<UsaspendingCategoryResponse> {
  return usaspendingFetch<UsaspendingCategoryResponse>(`/search/spending_by_category/${category}/`, {
    filters: {
      award_type_codes: ["A", "B", "C", "D"],
      ...filters,
    },
    category,
    page,
    limit,
  });
}

export async function searchKoreaAwards(params: Omit<SearchAwardsParams, "country"> = {}): Promise<UsaspendingSearchResponse> {
  return searchAwards({ ...params, country: "KOR" });
}
