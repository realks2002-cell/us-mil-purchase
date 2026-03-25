export const dynamic = "force-dynamic";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { getHeadToHead } from "@/lib/services/competitor-analysis";
import { formatAmount } from "@/lib/utils";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a: ueiA, b: ueiB } = await searchParams;

  if (!ueiA || !ueiB) {
    return (
      <>
        <Header title="업체 비교" description="두 업체를 선택하여 비교 분석합니다" />
        <div className="mt-6 rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          <Link href="/awards/competitors" className="text-primary hover:underline">
            경쟁사 분석 페이지
          </Link>
          에서 비교할 업체를 선택하세요.
        </div>
      </>
    );
  }

  const comparison = await getHeadToHead(ueiA, ueiB).catch(() => null);

  if (!comparison) {
    return (
      <>
        <Header title="업체 비교" description="비교 데이터를 가져올 수 없습니다" />
        <div className="mt-6 rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          선택한 업체의 데이터가 부족합니다.
        </div>
      </>
    );
  }

  const { vendorA, vendorB, commonNaics } = comparison;

  const metrics = [
    { label: "총 수주 건수", a: `${vendorA.totalCount}건`, b: `${vendorB.totalCount}건`, winner: vendorA.totalCount > vendorB.totalCount ? "a" : vendorB.totalCount > vendorA.totalCount ? "b" : null },
    { label: "총 수주 금액", a: formatAmount(vendorA.totalAmount), b: formatAmount(vendorB.totalAmount), winner: vendorA.totalAmount > vendorB.totalAmount ? "a" : vendorB.totalAmount > vendorA.totalAmount ? "b" : null },
    { label: "평균 금액", a: formatAmount(vendorA.avgAmount), b: formatAmount(vendorB.avgAmount), winner: vendorA.avgAmount > vendorB.avgAmount ? "a" : vendorB.avgAmount > vendorA.avgAmount ? "b" : null },
    { label: "경쟁 수주", a: `${vendorA.competitiveWins}건`, b: `${vendorB.competitiveWins}건`, winner: vendorA.competitiveWins > vendorB.competitiveWins ? "a" : vendorB.competitiveWins > vendorA.competitiveWins ? "b" : null },
    { label: "수의 계약", a: `${vendorA.soleSource}건`, b: `${vendorB.soleSource}건`, winner: null },
    { label: "평균 입찰 참여수", a: vendorA.avgOffers.toFixed(1), b: vendorB.avgOffers.toFixed(1), winner: null },
  ];

  return (
    <>
      <div className="mb-6">
        <Link href="/awards/competitors" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          &larr; 경쟁사 분석
        </Link>
        <Header title="업체 비교 분석" description={`${vendorA.name} vs ${vendorB.name} (최근 24개월)`} />
      </div>

      {/* 비교 테이블 */}
      <div className="mb-6 rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-6 py-4 text-left font-medium text-muted-foreground">지표</th>
              <th className="px-6 py-4 text-center font-medium">
                <Link href={`/awards/competitors/${vendorA.uei}`} className="hover:text-primary">
                  {vendorA.name}
                </Link>
              </th>
              <th className="px-6 py-4 text-center font-medium">
                <Link href={`/awards/competitors/${vendorB.uei}`} className="hover:text-primary">
                  {vendorB.name}
                </Link>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {metrics.map((m) => (
              <tr key={m.label} className="hover:bg-secondary/20">
                <td className="px-6 py-4 text-muted-foreground">{m.label}</td>
                <td className={`px-6 py-4 text-center font-mono ${m.winner === "a" ? "text-emerald-500 font-semibold" : ""}`}>
                  {m.a}
                </td>
                <td className={`px-6 py-4 text-center font-mono ${m.winner === "b" ? "text-emerald-500 font-semibold" : ""}`}>
                  {m.b}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 전문 분야 비교 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NaicsCard title={vendorA.name} naics={vendorA.topNaics} />
        <NaicsCard title={vendorB.name} naics={vendorB.topNaics} />
      </div>

      {/* 공통 분야 */}
      {commonNaics.length > 0 && (
        <div className="mt-6 rounded-xl border border-border bg-card p-6">
          <h3 className="mb-3 font-semibold">공통 경쟁 분야</h3>
          <div className="flex flex-wrap gap-2">
            {commonNaics.map((code) => (
              <span key={code} className="rounded-md bg-primary/10 px-3 py-1.5 text-sm font-mono text-primary">
                {code}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            두 업체가 동일하게 활동 중인 NAICS 분야입니다. 이 분야에서 직접 경쟁이 발생할 가능성이 높습니다.
          </p>
        </div>
      )}
    </>
  );
}

function NaicsCard({ title, naics }: {
  title: string;
  naics: { naicsCode: string; count: number; amount: number }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 font-semibold">{title} — 전문 분야</h3>
      {naics.length === 0 ? (
        <p className="text-sm text-muted-foreground">데이터 없음</p>
      ) : (
        <div className="space-y-3">
          {naics.map((n) => {
            const maxAmount = Math.max(...naics.map((x) => x.amount));
            const pct = maxAmount > 0 ? (n.amount / maxAmount) * 100 : 0;
            return (
              <div key={n.naicsCode}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-mono">{n.naicsCode}</span>
                  <span className="text-muted-foreground">{n.count}건 · {formatAmount(n.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
