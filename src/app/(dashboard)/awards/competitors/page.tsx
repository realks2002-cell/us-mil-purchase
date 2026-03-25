export const revalidate = 120;

import { Header } from "@/components/layout/header";
import { getTopAwardees, getCompetitorDetails, getNaicsBreakdown } from "@/lib/services/awards";
import { getCompetitorData } from "@/lib/services/ai-analysis";
import { getMarketOverview, getCompetitionTypeAnalysis, getTopVendors } from "@/lib/services/competitor-analysis";
import { formatAmount, safeParseFloat } from "@/lib/utils";
import { CompetitorAnalysisModal } from "@/components/ai/competitor-analysis-modal";
import { CompetitionTypeChart } from "@/components/charts/competition-type-chart";
import { VendorCard } from "@/components/competitors/vendor-card";
import { VendorSelector } from "@/components/competitors/vendor-selector";

export default async function CompetitorsPage() {
  const [topAwardees, naicsData, marketOverview, competitionTypes, usaVendors] = await Promise.all([
    getTopAwardees(10).catch(() => []),
    getNaicsBreakdown(12).catch(() => []),
    getMarketOverview(12).catch(() => null),
    getCompetitionTypeAnalysis(12).catch(() => []),
    getTopVendors(10, 12).catch(() => []),
  ]);

  const totalAmount = topAwardees.reduce((s, a) => s + a.totalAmount, 0);
  const topNaics = naicsData[0]?.naicsCode;

  const top5Names = topAwardees.slice(0, 5).map((a) => a.name);
  const [competitorData, details] = await Promise.all([
    topNaics ? getCompetitorData(topNaics).catch(() => null) : Promise.resolve(null),
    getCompetitorDetails(top5Names).catch(() => ({}) as Awaited<ReturnType<typeof getCompetitorDetails>>),
  ]);

  const marketShare = topAwardees.slice(0, 5).map((a, i) => ({
    company: a.name,
    pct: totalAmount > 0 ? Math.round((a.totalAmount / totalAmount) * 1000) / 10 : 0,
    color: ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"][i],
  }));

  const othersAmount = totalAmount - topAwardees.slice(0, 5).reduce((s, a) => s + a.totalAmount, 0);
  if (othersAmount > 0) {
    marketShare.push({
      company: `기타 (${Math.max(0, topAwardees.length - 5)}개사)`,
      pct: Math.round((othersAmount / totalAmount) * 1000) / 10,
      color: "bg-muted",
    });
  }

  const hasUsaspendingData = usaVendors.length > 0;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Header title="경쟁사 분석" description="주한미군 입찰 시장 경쟁사 동향 분석" />
        {topNaics && competitorData && (
          <CompetitorAnalysisModal naicsCode={topNaics} data={competitorData} />
        )}
      </div>

      {/* 시장 개요 카드 */}
      {marketOverview && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <OverviewCard label="총 계약" value={String(marketOverview.totalContracts)} sub="건" />
          <OverviewCard label="총 금액" value={formatAmount(marketOverview.totalAmount)} />
          <OverviewCard label="평균 금액" value={formatAmount(marketOverview.avgAmount)} />
          <OverviewCard label="참여 업체" value={String(marketOverview.uniqueVendors)} sub="개사" />
          <OverviewCard label="경쟁 비율" value={`${marketOverview.competitiveRate}%`} />
          <OverviewCard label="평균 입찰수" value={marketOverview.avgOffers.toFixed(1)} sub="개사" />
        </div>
      )}

      {topAwardees.length === 0 && !hasUsaspendingData ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          낙찰 데이터가 없습니다. 데이터 수집 후 분석이 가능합니다.
        </div>
      ) : (
        <>
          {/* 경쟁 유형 + 시장 점유율 */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 경쟁 유형 분포 */}
            {competitionTypes.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 font-semibold">경쟁 유형 분포</h3>
                <CompetitionTypeChart data={competitionTypes} />
              </div>
            )}

            {/* Market Share */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">시장 점유율 (SAM.gov 낙찰 금액 기준)</h3>
              <div className="flex items-center gap-1 h-10 rounded-lg overflow-hidden">
                {marketShare.map((item) => (
                  <div
                    key={item.company}
                    className={`h-full ${item.color} flex items-center justify-center text-[10px] font-medium text-white transition-all hover:opacity-80`}
                    style={{ width: `${Math.max(item.pct, 2)}%` }}
                    title={`${item.company}: ${item.pct}%`}
                  >
                    {item.pct > 8 && `${item.pct}%`}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                {marketShare.map((item) => (
                  <div key={item.company} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                    {item.company} ({item.pct}%)
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 업체 비교 선택기 */}
          {hasUsaspendingData && (
            <div className="mb-6 rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">업체 비교 분석</h3>
              <VendorSelector
                vendors={usaVendors.map((v) => ({ name: v.name, uei: v.uei }))}
              />
            </div>
          )}

          {/* USAspending 벤더 카드 (있으면 우선) */}
          {hasUsaspendingData ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">주요 경쟁사 (USA Spending 기준)</h3>
              {usaVendors.map((v) => (
                <VendorCard
                  key={v.uei ?? v.name}
                  rank={v.rank}
                  name={v.name}
                  uei={v.uei}
                  count={v.count}
                  totalAmount={v.totalAmount}
                  avgAmount={v.avgAmount}
                  competitiveWins={v.competitiveWins}
                  soleSource={v.soleSource}
                  competitiveRate={v.competitiveRate}
                />
              ))}
            </div>
          ) : (
            /* SAM.gov 데이터만 있을 때 기존 카드 */
            <div className="space-y-6">
              {topAwardees.slice(0, 5).map((comp) => {
                const detail = details[comp.name];
                return (
                  <div key={comp.name} className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{comp.name}</h3>
                        {comp.uei && (
                          <span className="text-xs font-mono text-muted-foreground">UEI: {comp.uei}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-6 text-center">
                        <div>
                          <div className="text-2xl font-bold">{comp.count}</div>
                          <div className="text-xs text-muted-foreground">총 낙찰</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-emerald-500">{formatAmount(comp.totalAmount)}</div>
                          <div className="text-xs text-muted-foreground">총 금액</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{formatAmount(comp.avgAmount)}</div>
                          <div className="text-xs text-muted-foreground">평균 금액</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                      <div className="p-5">
                        <h4 className="mb-3 text-sm font-medium text-muted-foreground">주요 분야</h4>
                        <div className="flex flex-wrap gap-2">
                          {detail?.naicsBreakdown.map((n) => (
                            <span key={n.naicsCode} className="rounded-md bg-secondary px-2.5 py-1 text-xs">
                              <span className="font-mono text-primary">{n.naicsCode}</span> ({n.count}건)
                            </span>
                          ))}
                          {(!detail || detail.naicsBreakdown.length === 0) && (
                            <span className="text-xs text-muted-foreground">데이터 없음</span>
                          )}
                        </div>
                      </div>
                      <div className="p-5">
                        <h4 className="mb-3 text-sm font-medium text-muted-foreground">최근 낙찰</h4>
                        <div className="space-y-2">
                          {detail?.recentAwards.map((award, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="truncate max-w-[250px]">{award.title || "제목 없음"}</span>
                              <span className="shrink-0 font-mono text-xs text-emerald-500">
                                {award.amount ? formatAmount(safeParseFloat(award.amount)) : "N/A"}
                              </span>
                            </div>
                          ))}
                          {(!detail || detail.recentAwards.length === 0) && (
                            <span className="text-xs text-muted-foreground">데이터 없음</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

function OverviewCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">
        {value}
        {sub && <span className="text-sm font-normal text-muted-foreground ml-0.5">{sub}</span>}
      </div>
    </div>
  );
}
