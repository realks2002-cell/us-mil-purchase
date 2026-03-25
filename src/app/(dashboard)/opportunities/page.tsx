export const dynamic = "force-dynamic";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/badges";
import { getOpportunities, getNaicsCodes } from "@/lib/services/opportunities";
import { OpportunitySearch } from "./search";
import { daysUntil } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

function getDisplayStatus(opp: { status: string; responseDeadline: Date | null }) {
  if (opp.status !== "active") return "closed";
  const days = daysUntil(opp.responseDeadline);
  if (days !== null && days <= 7 && days >= 0) return "closing";
  return "active";
}

export default async function OpportunitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const search = params.search || "";
  const type = params.type || "";
  const status = params.status || "";
  const naicsCode = params.naics || "";

  const [result, naicsCodes] = await Promise.all([
    getOpportunities({ search, type, status, naicsCode, page, pageSize: 20 }).catch(() => ({ data: [], total: 0, totalPages: 0 })),
    getNaicsCodes().catch(() => []),
  ]);

  return (
    <>
      <Header title="입찰 공고" description="SAM.gov에서 수집된 주한미군 관련 입찰 공고 목록" />

      <OpportunitySearch
        naicsCodes={naicsCodes}
        total={result.total}
        currentSearch={search}
        currentType={type}
        currentStatus={status}
        currentNaics={naicsCode}
      />

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">공고번호</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">공고명</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">기관</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">유형</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAICS</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">마감일</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.data.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  {search ? `"${search}"에 대한 검색 결과가 없습니다.` : "수집된 공고가 없습니다."}
                </td>
              </tr>
            ) : (
              result.data.map((opp) => {
                const displayStatus = getDisplayStatus(opp);
                const days = daysUntil(opp.responseDeadline);
                return (
                  <tr key={opp.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link href={`/opportunities/${opp.id}`} className="text-primary hover:underline">
                        {opp.noticeId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/opportunities/${opp.id}`} className="block">
                        <div className="max-w-xs truncate font-medium hover:text-primary">{opp.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {[opp.placeCity, opp.placeCountry].filter(Boolean).join(", ")}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="max-w-[140px] truncate">{opp.department}</div>
                      <div className="text-xs truncate">{opp.office}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {opp.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{opp.naicsCode}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {opp.responseDeadline?.toLocaleDateString("ko-KR")}
                      {days !== null && days >= 0 && days <= 7 && (
                        <div className="text-warning text-[10px]">D-{days}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={displayStatus} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {(page - 1) * 20 + 1} - {Math.min(page * 20, result.total)} / 총 {result.total}건
          </span>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={{ pathname: "/opportunities", query: { ...params, page: String(page - 1) } }}
                className="h-8 rounded-md border border-input px-3 text-sm hover:bg-secondary inline-flex items-center"
              >
                이전
              </Link>
            )}
            {Array.from({ length: Math.min(result.totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <Link
                  key={p}
                  href={{ pathname: "/opportunities", query: { ...params, page: String(p) } }}
                  className={`h-8 rounded-md px-3 text-sm inline-flex items-center ${
                    p === page ? "bg-primary text-primary-foreground" : "border border-input hover:bg-secondary"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
            {page < result.totalPages && (
              <Link
                href={{ pathname: "/opportunities", query: { ...params, page: String(page + 1) } }}
                className="h-8 rounded-md border border-input px-3 text-sm hover:bg-secondary inline-flex items-center"
              >
                다음
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
