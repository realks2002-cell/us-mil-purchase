import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { db } from "@/lib/db";
import { awards, opportunities } from "@/lib/db/schema";
import { desc, eq, and, gte, isNotNull, sql, count } from "drizzle-orm";
import { formatAmount } from "@/lib/utils";

async function getCompetitorData(naicsCode: string) {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 2);

  const [topAwardees, totalStats, recentAwards] = await Promise.all([
    db
      .select({
        name: awards.awardeeName,
        count: count(),
        totalAmount: sql<string>`coalesce(sum(${awards.awardAmount}), 0)`,
        avgAmount: sql<string>`coalesce(avg(${awards.awardAmount}), 0)`,
        minAmount: sql<string>`coalesce(min(${awards.awardAmount}), 0)`,
        maxAmount: sql<string>`coalesce(max(${awards.awardAmount}), 0)`,
      })
      .from(awards)
      .where(and(eq(awards.naicsCode, naicsCode), gte(awards.dateSigned, since), isNotNull(awards.awardeeName)))
      .groupBy(awards.awardeeName)
      .orderBy(desc(sql`sum(${awards.awardAmount})`))
      .limit(10),
    db
      .select({
        totalCount: count(),
        totalAmount: sql<string>`coalesce(sum(${awards.awardAmount}), 0)`,
        avgAmount: sql<string>`coalesce(avg(${awards.awardAmount}), 0)`,
      })
      .from(awards)
      .where(and(eq(awards.naicsCode, naicsCode), gte(awards.dateSigned, since))),
    db
      .select({
        title: awards.title,
        awardeeName: awards.awardeeName,
        amount: awards.awardAmount,
        date: awards.dateSigned,
      })
      .from(awards)
      .where(and(eq(awards.naicsCode, naicsCode), gte(awards.dateSigned, since)))
      .orderBy(desc(awards.dateSigned))
      .limit(20),
  ]);

  return { topAwardees, totalStats: totalStats[0], recentAwards };
}

async function getOpportunityContext(opportunityId: number) {
  const opp = await db.query.opportunities.findFirst({
    where: eq(opportunities.id, opportunityId),
  });
  if (!opp) return null;

  const relatedAwards = opp.naicsCode
    ? await db
        .select({
          awardeeName: awards.awardeeName,
          amount: awards.awardAmount,
          date: awards.dateSigned,
          title: awards.title,
        })
        .from(awards)
        .where(eq(awards.naicsCode, opp.naicsCode))
        .orderBy(desc(awards.dateSigned))
        .limit(10)
    : [];

  return { opportunity: opp, relatedAwards };
}

export function streamCompetitorAnalysis(naicsCode: string, data: Awaited<ReturnType<typeof getCompetitorData>>) {
  const prompt = `당신은 미국 정부 조달 시장 전문 분석가입니다. 주한미군(USFK) 관련 입찰 데이터를 분석하여 한국 기업의 입찰 전략 수립을 지원합니다.

다음 NAICS 코드 ${naicsCode} 분야의 낙찰 데이터를 분석해주세요.

## 시장 개요
- 최근 2년간 총 낙찰: ${data.totalStats.totalCount}건
- 총 낙찰 금액: $${parseFloat(data.totalStats.totalAmount).toLocaleString()}
- 평균 낙찰 금액: $${parseFloat(data.totalStats.avgAmount).toLocaleString()}

## 상위 낙찰 업체 (TOP ${data.topAwardees.length})
${data.topAwardees.map((a, i) =>
  `${i + 1}. ${a.name}: ${a.count}건, 총 $${parseFloat(a.totalAmount).toLocaleString()}, 평균 $${parseFloat(a.avgAmount).toLocaleString()} (범위: $${parseFloat(a.minAmount).toLocaleString()} ~ $${parseFloat(a.maxAmount).toLocaleString()})`
).join("\n")}

## 최근 낙찰 내역 (최근 20건)
${data.recentAwards.map(a =>
  `- ${a.date?.toISOString().split("T")[0] || "N/A"} | ${a.awardeeName} | $${a.amount ? parseFloat(a.amount).toLocaleString() : "N/A"} | ${a.title || "제목 없음"}`
).join("\n")}

다음 항목을 포함하여 분석해주세요:
1. **경쟁 구도 요약**: 주요 경쟁사별 강점, 시장 지배력
2. **가격 동향**: 낙찰 금액 추이, 평균 단가 변화
3. **시장 진입 전략**: 한국 기업이 이 분야에 진입하기 위한 전략적 조언
4. **위험 요소**: 주의해야 할 경쟁 환경의 위험 요소
5. **추천 액션**: 구체적인 다음 행동 3가지

한국어로 작성하되, 업체명과 금액은 원본 그대로 유지해주세요.`;

  return streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt,
  });
}

export function streamOpportunityAnalysis(context: NonNullable<Awaited<ReturnType<typeof getOpportunityContext>>>) {
  const { opportunity: opp, relatedAwards } = context;

  const prompt = `당신은 미국 정부 조달 전문 컨설턴트입니다. 다음 입찰 공고를 분석하여 한국 기업의 입찰 참여를 지원합니다.

## 공고 정보
- 제목: ${opp.title}
- 공고번호: ${opp.noticeId}
- 기관: ${opp.department} / ${opp.office}
- NAICS: ${opp.naicsCode}
- Set-Aside: ${opp.setAside || "없음"}
- 마감일: ${opp.responseDeadline?.toISOString().split("T")[0] || "미정"}
- 수행지: ${[opp.placeCity, opp.placeState, opp.placeCountry].filter(Boolean).join(", ")}

## 공고 내용
${opp.description?.slice(0, 2000) || "내용 없음"}

## 유사 분야 최근 낙찰 내역
${relatedAwards.map(a =>
  `- ${a.awardeeName} | $${a.amount ? parseFloat(a.amount).toLocaleString() : "N/A"} | ${a.date?.toISOString().split("T")[0] || "N/A"}`
).join("\n") || "데이터 없음"}

다음을 분석해주세요:
1. **공고 요약**: 핵심 요구사항 3줄 요약
2. **예상 낙찰가**: 유사 과거 낙찰 데이터 기반 예측 범위
3. **경쟁 강도**: 예상 경쟁 업체 수와 경쟁 강도 (상/중/하)
4. **필요 자격**: 참여에 필요한 핵심 자격 요건
5. **입찰 전략**: 경쟁력을 확보하기 위한 구체적 전략
6. **추천/비추천**: 입찰 참여 추천 여부와 근거

한국어로 작성해주세요.`;

  return streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt,
  });
}

export { getCompetitorData, getOpportunityContext };
