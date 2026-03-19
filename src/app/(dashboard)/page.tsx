export const dynamic = "force-dynamic";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { StatusBadge, TypeBadge } from "@/components/ui/badges";
import {
  getDashboardStats,
  getRecentOpportunities,
  getClosingOpportunities,
} from "@/lib/services/opportunities";

function daysUntil(date: Date | null): number | null {
  if (!date) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function DashboardPage() {
  const [stats, recentOpps, closingOpps] = await Promise.all([
    getDashboardStats(),
    getRecentOpportunities(5),
    getClosingOpportunities(5),
  ]);

  const statCards = [
    { label: "오늘 신규 공고", value: String(stats.newToday) },
    { label: "마감 임박 (7일)", value: String(stats.closingSoon) },
    { label: "활성 공고", value: String(stats.totalActive) },
  ];

  return (
    <>
      <Header title="대시보드" description="주한미군 입찰 현황 요약" />

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="mt-2 text-3xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Opportunities */}
        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">최근 공고</h2>
            <Link href="/opportunities" className="text-sm text-primary hover:underline">
              전체 보기 →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentOpps.length === 0 ? (
              <div className="px-5 py-12 text-center text-muted-foreground">
                수집된 공고가 없습니다. Cron이 실행되면 자동으로 표시됩니다.
              </div>
            ) : (
              recentOpps.map((opp) => {
                const days = daysUntil(opp.responseDeadline);
                const displayStatus =
                  opp.status !== "active" ? "closed" : days !== null && days <= 7 && days >= 0 ? "closing" : "active";
                return (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="flex flex-col gap-2 px-5 py-3.5 hover:bg-secondary/50 transition-colors sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{opp.title}</span>
                        <StatusBadge status={displayStatus} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3">
                        <span>{opp.department}</span>
                        {opp.type && (
                          <>
                            <span className="hidden sm:inline">·</span>
                            <TypeBadge type={opp.type} />
                          </>
                        )}
                        {opp.naicsCode && (
                          <>
                            <span className="hidden sm:inline">·</span>
                            <span className="font-mono">{opp.naicsCode}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-xs text-muted-foreground">
                        마감 {opp.responseDeadline?.toLocaleDateString("ko-KR") || "미정"}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column - Closing Soon */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">마감 임박</h2>
          </div>
          <div className="divide-y divide-border">
            {closingOpps.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                마감 임박 공고가 없습니다.
              </div>
            ) : (
              closingOpps.map((opp) => {
                const days = daysUntil(opp.responseDeadline) ?? 0;
                return (
                  <Link
                    key={opp.id}
                    href={`/opportunities/${opp.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        days <= 3 ? "bg-destructive/10 text-destructive" : days <= 7 ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      D-{days}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm">{opp.title}</div>
                      <div className="text-xs text-muted-foreground">{opp.type}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
