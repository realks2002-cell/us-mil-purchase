export const revalidate = 300;

import { Header } from "@/components/layout/header";
import {
  getMonthlyOrderingPattern,
  getAgencyOrderingPattern,
  getNaicsOrderingPattern,
  getQuarterlyPattern,
} from "@/lib/services/ordering-patterns";
import { formatAmount } from "@/lib/utils";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend";

export default async function PatternsPage() {
  const [monthly, agencies, naics, quarterly] = await Promise.all([
    getMonthlyOrderingPattern(24).catch(() => []),
    getAgencyOrderingPattern(12).catch(() => []),
    getNaicsOrderingPattern(12).catch(() => []),
    getQuarterlyPattern(24).catch(() => []),
  ]);

  const chartData = monthly.map((m) => ({
    month: m.month,
    count: m.count,
    amount: m.amount,
  }));

  return (
    <>
      <Header title="발주 패턴 분석" description="USA Spending 데이터 기반 월별/기관별/분야별 발주 주기 분석" />

      {monthly.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          USA Spending 데이터가 없습니다. 먼저 데이터를 수집해주세요.
        </div>
      ) : (
        <>
          {/* 월별 추이 */}
          <div className="mt-6 rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 font-semibold">월별 발주 추이 (최근 24개월)</h3>
            <MonthlyTrendChart data={chartData} />
          </div>

          {/* 분기별 */}
          {quarterly.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">분기별 발주 현황</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {quarterly.map((q) => (
                  <div key={q.quarter} className="rounded-lg border border-border p-3 text-center">
                    <div className="text-xs text-muted-foreground">{q.quarter}</div>
                    <div className="mt-1 text-lg font-bold">{q.count}<span className="text-sm font-normal text-muted-foreground">건</span></div>
                    <div className="text-xs text-emerald-500">{formatAmount(q.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 기관별 */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">기관별 발주 현황</h3>
              <div className="space-y-3">
                {agencies.map((a) => {
                  const maxAmount = agencies[0]?.amount ?? 1;
                  const pct = (a.amount / maxAmount) * 100;
                  return (
                    <div key={a.agency}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="truncate max-w-[200px]">{a.agency}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{a.count}건 · {formatAmount(a.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-chart-1 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NAICS별 */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">NAICS별 발주 현황</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">NAICS</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">건수</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">총액</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">평균 입찰수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {naics.map((n) => (
                      <tr key={n.naicsCode} className="hover:bg-secondary/20">
                        <td className="px-3 py-2">
                          <span className="font-mono">{n.naicsCode}</span>
                          {n.naicsDescription && (
                            <span className="ml-2 text-xs text-muted-foreground truncate">{n.naicsDescription.slice(0, 30)}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">{n.count}</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-500">{formatAmount(n.amount)}</td>
                        <td className="px-3 py-2 text-right">{n.avgOffers.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
