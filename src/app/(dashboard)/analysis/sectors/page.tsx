export const revalidate = 300;

import { Header } from "@/components/layout/header";
import { getGrowingSectors, getLowCompetitionSectors, getNaicsDistribution, getUsaspendingTotalCount } from "@/lib/services/sector-analysis";
import { formatAmount } from "@/lib/utils";

export default async function SectorsPage() {
  const [growing, lowComp, totalCount, naicsDist] = await Promise.all([
    getGrowingSectors().catch(() => []),
    getLowCompetitionSectors(12).catch(() => []),
    getUsaspendingTotalCount().catch(() => 0),
    getNaicsDistribution().catch(() => []),
  ]);

  const topGrowing = growing.filter((s) => s.growthRate > 0).slice(0, 15);
  const declining = growing.filter((s) => s.growthRate < 0).slice(-10).reverse();
  const hasAnalysis = topGrowing.length > 0 || lowComp.length > 0 || declining.length > 0;

  return (
    <>
      <Header title="유망 분야 분석" description="YoY 성장 분야 및 경쟁 강도 낮은 분야 도출" />

      {totalCount === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          USA Spending 데이터가 없습니다. 먼저 데이터를 수집해주세요.
        </div>
      ) : !hasAnalysis ? (
        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
            <p>데이터 <span className="font-semibold text-foreground">{totalCount}건</span> 수집됨. YoY 성장 분석에는 더 많은 데이터가 필요합니다.</p>
            <p className="mt-1 text-xs">설정 &gt; 데이터 수집에서 USA Spending 수집을 다시 실행하면 최대 2년치 데이터를 가져옵니다.</p>
          </div>

          {naicsDist.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-blue-500">NAICS 분야별 현황 (전체 기간)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAICS</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">건수</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">총액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {naicsDist.map((s) => (
                      <tr key={s.naicsCode} className="hover:bg-secondary/20">
                        <td className="px-4 py-3 font-mono">{s.naicsCode}</td>
                        <td className="px-4 py-3 text-xs truncate max-w-[200px]">{s.naicsDescription || "-"}</td>
                        <td className="px-4 py-3 text-right">{s.count}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-500">{formatAmount(s.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 성장 분야 */}
          {topGrowing.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-emerald-500">성장 분야 (YoY 금액 기준)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAICS</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">금년 건수</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">금년 금액</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">전년 금액</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">성장률</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {topGrowing.map((s) => (
                      <tr key={s.naicsCode} className="hover:bg-secondary/20">
                        <td className="px-4 py-3 font-mono">{s.naicsCode}</td>
                        <td className="px-4 py-3 text-xs truncate max-w-[200px]">{s.naicsDescription || "-"}</td>
                        <td className="px-4 py-3 text-right">{s.currentCount}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-500">{formatAmount(s.currentAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatAmount(s.previousAmount)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                            +{s.growthRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 경쟁 강도 낮은 분야 */}
          {lowComp.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-amber-500">경쟁 강도 낮은 분야 (진입 기회)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAICS</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">건수</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">총액</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">평균 입찰수</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">참여 업체</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">수의 비율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lowComp.map((s) => (
                      <tr key={s.naicsCode} className="hover:bg-secondary/20">
                        <td className="px-4 py-3 font-mono">{s.naicsCode}</td>
                        <td className="px-4 py-3 text-xs truncate max-w-[200px]">{s.naicsDescription || "-"}</td>
                        <td className="px-4 py-3 text-right">{s.count}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-500">{formatAmount(s.amount)}</td>
                        <td className="px-4 py-3 text-right">{s.avgOffers.toFixed(1)}</td>
                        <td className="px-4 py-3 text-right">{s.uniqueVendors}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            s.soleSourceRate > 50
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {s.soleSourceRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 축소 분야 */}
          {declining.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-destructive">축소 분야 (주의)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAICS</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">금년</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">전년</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">변동</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {declining.map((s) => (
                      <tr key={s.naicsCode} className="hover:bg-secondary/20">
                        <td className="px-4 py-3 font-mono">{s.naicsCode}</td>
                        <td className="px-4 py-3 text-xs truncate max-w-[200px]">{s.naicsDescription || "-"}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatAmount(s.currentAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatAmount(s.previousAmount)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            {s.growthRate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
