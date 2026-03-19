export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getTopAwardees, getCompetitorDetails, getNaicsBreakdown } from "@/lib/services/awards";
import { formatAmount, safeParseFloat } from "@/lib/utils";
import { AiAnalysisPanel } from "@/components/ai/analysis-panel";

export default async function CompetitorsPage() {
  const [topAwardees, naicsData] = await Promise.all([
    getTopAwardees(10),
    getNaicsBreakdown(12),
  ]);

  const totalAmount = topAwardees.reduce((s, a) => s + a.totalAmount, 0);
  const topNaics = naicsData[0]?.naicsCode;

  // 상위 5개 업체 상세 정보 일괄 조회 (2쿼리)
  const top5Names = topAwardees.slice(0, 5).map((a) => a.name);
  const details = await getCompetitorDetails(top5Names);

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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Header title="경쟁사 분석" description="주한미군 입찰 시장 경쟁사 동향 분석" />
        {topNaics && (
          <AiAnalysisPanel
            apiUrl="/api/ai/competitor"
            body={{ naicsCode: topNaics }}
            buttonLabel="AI 시장 분석"
            title={`NAICS ${topNaics} 시장 AI 분석`}
          />
        )}
      </div>

      {topAwardees.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          낙찰 데이터가 없습니다. 데이터 수집 후 분석이 가능합니다.
        </div>
      ) : (
        <>
          {/* Market Share */}
          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">시장 점유율 (낙찰 금액 기준)</h3>
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

          {/* Competitor Cards */}
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
                        <div className="text-2xl font-bold text-success">{formatAmount(comp.totalAmount)}</div>
                        <div className="text-xs text-muted-foreground">총 금액</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{formatAmount(comp.avgAmount)}</div>
                        <div className="text-xs text-muted-foreground">평균 금액</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                    {/* Main NAICS */}
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

                    {/* Recent Awards */}
                    <div className="p-5">
                      <h4 className="mb-3 text-sm font-medium text-muted-foreground">최근 낙찰</h4>
                      <div className="space-y-2">
                        {detail?.recentAwards.map((award, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[250px]">{award.title || "제목 없음"}</span>
                            <span className="shrink-0 font-mono text-xs text-success">
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
        </>
      )}
    </>
  );
}
