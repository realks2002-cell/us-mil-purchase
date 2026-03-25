export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  getVendorProfile,
  getVendorWinHistory,
  getVendorRecentAwards,
  getCompetitionTypeAnalysis,
} from "@/lib/services/competitor-analysis";
import { formatAmount, safeParseFloat } from "@/lib/utils";
import { VendorTimelineChart } from "@/components/charts/vendor-timeline-chart";
import { CompetitionTypeChart } from "@/components/charts/competition-type-chart";
import { db } from "@/lib/db";
import { usaspendingAwards } from "@/lib/db/schema";
import { eq, isNotNull, desc, sql, count } from "drizzle-orm";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ uei: string }>;
}) {
  const { uei } = await params;
  const decodedUei = decodeURIComponent(uei);

  const [vendor, winHistory, recentAwards] = await Promise.all([
    getVendorProfile(decodedUei),
    getVendorWinHistory(decodedUei, 24),
    getVendorRecentAwards(decodedUei, 20),
  ]);

  if (!vendor) notFound();

  // 이 벤더의 경쟁 유형 분석
  const vendorCompetition = await db
    .select({
      competitionType: usaspendingAwards.competitionType,
      count: count(),
      totalAmount: sql<string>`coalesce(sum(${usaspendingAwards.totalObligation}), 0)`,
    })
    .from(usaspendingAwards)
    .where(
      eq(usaspendingAwards.awardeeUei, decodedUei),
    )
    .groupBy(usaspendingAwards.competitionType)
    .orderBy(desc(count()));

  const competitionMap: Record<string, string> = {
    A: "경쟁입찰", FULL_AND_OPEN: "경쟁입찰", "FULL AND OPEN COMPETITION": "경쟁입찰",
    CDO: "경쟁입찰", "COMPETED UNDER SAP": "경쟁입찰",
    SSS: "단독수의", SOLE_SOURCE: "단독수의", "SOLE SOURCE": "단독수의",
    "NOT COMPETED": "비경쟁", "NOT AVAILABLE FOR COMPETITION": "비경쟁",
  };

  const grouped: Record<string, { count: number; amount: number }> = {};
  for (const r of vendorCompetition) {
    const label = competitionMap[r.competitionType ?? ""] ?? "기타";
    if (!grouped[label]) grouped[label] = { count: 0, amount: 0 };
    grouped[label].count += r.count;
    grouped[label].amount += safeParseFloat(r.totalAmount);
  }

  const competitionData = Object.entries(grouped).map(([type, data]) => ({
    type,
    count: data.count,
    amount: data.amount,
  }));

  return (
    <>
      <div className="mb-6">
        <Link href="/awards/competitors" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          &larr; 경쟁사 분석
        </Link>
        <Header title={vendor.name} description={`UEI: ${vendor.uei}`} />
      </div>

      {/* 요약 카드 */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="총 수주" value={String(vendor.totalAwardCount ?? 0)} sub="건" />
        <StatCard label="총 금액" value={formatAmount(safeParseFloat(vendor.totalAwardAmount))} />
        <StatCard label="평균 금액" value={formatAmount(safeParseFloat(vendor.avgContractValue))} />
        <StatCard label="경쟁 수주" value={String(vendor.competitiveWinCount ?? 0)} sub="건" />
        <StatCard label="수의 계약" value={String(vendor.soleSourceCount ?? 0)} sub="건" />
        <StatCard
          label="경쟁률"
          value={`${(vendor.totalAwardCount ?? 0) > 0
            ? Math.round(((vendor.competitiveWinCount ?? 0) / (vendor.totalAwardCount ?? 1)) * 1000) / 10
            : 0}%`}
        />
      </div>

      {/* 수주 이력 타임라인 + 경쟁 유형 */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">수주 이력 (최근 24개월)</h3>
          <VendorTimelineChart data={winHistory} />
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">경쟁 유형 분석</h3>
          <CompetitionTypeChart data={competitionData} />
        </div>
      </div>

      {/* NAICS별 수주 분포 */}
      {vendor.naicsStats.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">NAICS별 수주 분포</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAICS</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">수주</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">총 금액</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">평균 금액</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">경쟁</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">수의</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vendor.naicsStats.map((ns) => (
                  <tr key={ns.naicsCode} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono">{ns.naicsCode}</td>
                    <td className="px-4 py-3 text-right">{ns.awardCount}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-500">
                      {formatAmount(safeParseFloat(ns.totalAmount))}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatAmount(safeParseFloat(ns.avgAmount))}
                    </td>
                    <td className="px-4 py-3 text-right">{ns.competitiveWinCount}</td>
                    <td className="px-4 py-3 text-right">{ns.soleSourceCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 최근 수주 내역 */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold">최근 수주 내역</h3>
        {recentAwards.length === 0 ? (
          <p className="text-sm text-muted-foreground">데이터 없음</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">계약번호</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAICS</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">금액</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">경쟁유형</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">입찰수</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">시작일</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">발주기관</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAwards.map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-mono text-xs">{a.piid || "-"}</td>
                    <td className="px-4 py-3 font-mono">{a.naicsCode || "-"}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-500">
                      {a.totalObligation ? formatAmount(safeParseFloat(a.totalObligation)) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <CompetitionBadge type={a.competitionType} />
                    </td>
                    <td className="px-4 py-3 text-right">{a.numberOfOffers ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {a.startDate ? new Date(a.startDate).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs truncate max-w-[200px]">{a.awardingAgency || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
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

function CompetitionBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-xs text-muted-foreground">-</span>;

  const competitive = ["A", "FULL_AND_OPEN", "FULL AND OPEN COMPETITION", "CDO", "COMPETED UNDER SAP"];
  const soleSource = ["SSS", "SOLE_SOURCE", "SOLE SOURCE", "NOT COMPETED", "NOT AVAILABLE FOR COMPETITION"];

  if (competitive.includes(type)) {
    return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">경쟁</span>;
  }
  if (soleSource.includes(type)) {
    return <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">수의</span>;
  }
  return <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{type}</span>;
}
