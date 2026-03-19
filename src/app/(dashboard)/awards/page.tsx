export const dynamic = "force-dynamic";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend";
import { AmountDistributionChart } from "@/components/charts/amount-distribution";
import {
  getAwardStats,
  getMonthlyTrend,
  getNaicsBreakdown,
  getAmountDistribution,
  getTopAwardees,
} from "@/lib/services/awards";
import { formatAmount } from "@/lib/utils";

export default async function AwardsPage() {
  const [stats, monthly, naics, amountDist, topAwardees] = await Promise.all([
    getAwardStats(),
    getMonthlyTrend(),
    getNaicsBreakdown(),
    getAmountDistribution(),
    getTopAwardees(5),
  ]);

  const summaryStats = [
    { label: "총 낙찰 건수", value: stats.totalCount.toLocaleString(), period: "최근 12개월" },
    { label: "총 낙찰 금액", value: formatAmount(stats.totalAmount), period: "최근 12개월" },
    { label: "평균 낙찰 금액", value: formatAmount(stats.avgAmount), period: "최근 12개월" },
    { label: "주요 낙찰 업체", value: String(stats.uniqueAwardees), period: "고유 업체 수" },
  ];

  const totalNaicsAmount = naics.reduce((s, n) => s + n.amount, 0);

  return (
    <>
      <Header title="낙찰 분석" description="과거 낙찰 데이터 기반 분석 대시보드" />

      {/* Summary Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="mt-2 text-3xl font-bold">{stat.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{stat.period}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-6 font-semibold">월별 낙찰 추이</h3>
          <MonthlyTrendChart data={monthly} />
        </div>

        {/* Amount Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-6 font-semibold">금액별 분포</h3>
          <AmountDistributionChart data={amountDist} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* NAICS Breakdown */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">NAICS 분야별 낙찰 현황</h3>
          {naics.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">NAICS</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">건수</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">금액</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">비중</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {naics.map((item) => {
                    const pct = totalNaicsAmount > 0 ? (item.amount / totalNaicsAmount) * 100 : 0;
                    return (
                      <tr key={item.naicsCode}>
                        <td className="py-2.5 font-mono text-xs text-primary">{item.naicsCode}</td>
                        <td className="py-2.5 text-right font-mono">{item.count}</td>
                        <td className="py-2.5 text-right font-mono text-success">{formatAmount(item.amount)}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded bg-secondary overflow-hidden">
                              <div className="h-full rounded bg-chart-1" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Awardees */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">상위 낙찰 업체</h3>
            <Link href="/awards/competitors" className="text-sm text-primary hover:underline">
              경쟁사 분석 →
            </Link>
          </div>
          {topAwardees.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">#</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">업체명</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">건수</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">금액</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topAwardees.map((a) => (
                    <tr key={a.rank} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 font-mono text-muted-foreground">{a.rank}</td>
                      <td className="py-3 font-medium">{a.name}</td>
                      <td className="py-3 text-right font-mono">{a.count}</td>
                      <td className="py-3 text-right font-mono text-success">{formatAmount(a.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
