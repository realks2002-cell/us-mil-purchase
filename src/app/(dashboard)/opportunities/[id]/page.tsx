import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatusBadge } from "@/components/ui/badges";
import { AiAnalysisPanel } from "@/components/ai/analysis-panel";
import { ExternalContent } from "@/components/opportunities/external-content";
import { getOpportunityById } from "@/lib/services/opportunities";
import { getNoticeDescription } from "@/lib/sam-api/client";
import { db } from "@/lib/db";
import { opportunities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { daysUntil, stripHtml } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) notFound();
  const opp = await getOpportunityById(numId);

  if (!opp) notFound();

  // description이 없거나 URL인 경우 SAM API에서 가져와 DB 업데이트
  if (!opp.description || opp.description.startsWith("https://api.sam.gov/")) {
    const fetched = await getNoticeDescription(opp.noticeId);
    if (fetched) {
      const cleaned = stripHtml(fetched);
      opp.description = cleaned;
      await db
        .update(opportunities)
        .set({ description: cleaned })
        .where(eq(opportunities.id, opp.id))
        .catch(() => {});
    }
  }

  const days = daysUntil(opp.responseDeadline);
  const displayStatus =
    opp.status !== "active" ? "closed" : days !== null && days <= 7 && days >= 0 ? "closing" : "active";

  const contacts = (opp.pointOfContact as Array<{ fullName?: string; email?: string; phone?: string }>) || [];
  const contact = contacts[0];

  return (
    <>
      <Header title="공고 상세" />

      <div className="mb-6 flex items-center gap-3">
        <Link href="/opportunities" className="text-sm text-primary hover:underline">
          ← 목록으로
        </Link>
        <StatusBadge status={displayStatus} />
        {opp.type && (
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {opp.type}
          </span>
        )}
      </div>

      {/* Title Section */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold">{opp.title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="font-mono text-primary">{opp.noticeId}</span>
          {opp.department && <><span>·</span><span>{opp.department}</span></>}
          {opp.office && <><span>·</span><span>{opp.office}</span></>}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-xs text-muted-foreground">NAICS</div>
            <div className="mt-1 font-mono text-sm font-semibold">{opp.naicsCode || "N/A"}</div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-xs text-muted-foreground">제출 마감</div>
            <div className="mt-1 text-sm font-semibold text-warning">
              {opp.responseDeadline?.toLocaleDateString("ko-KR") || "미정"}
            </div>
            {days !== null && days >= 0 && (
              <div className="text-xs text-muted-foreground">D-{days}</div>
            )}
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-xs text-muted-foreground">Set-Aside</div>
            <div className="mt-1 text-sm font-semibold">{opp.setAside || "N/A"}</div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-xs text-muted-foreground">수행 장소</div>
            <div className="mt-1 text-sm font-semibold">
              {[opp.placeCity, opp.placeState, opp.placeCountry].filter(Boolean).join(", ") || "N/A"}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Main Content */}
        <div className="space-y-6">
          {opp.description && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">공고 내용</h3>
                <AiAnalysisPanel
                  apiUrl="/api/ai/summary"
                  body={{ opportunityId: opp.id }}
                  buttonLabel="AI 요약"
                  title={`${opp.title} — 한국어 요약`}
                />
              </div>
              <ExternalContent description={opp.description} />
            </div>
          )}

          {Array.isArray(opp.resourceLinks) && opp.resourceLinks.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">첨부파일</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                SAM.gov 로그인 후 공고 페이지에서 다운로드할 수 있습니다.
              </p>
              <div className="space-y-2">
                {(opp.resourceLinks as string[])
                  .filter((link: string) => link.startsWith("http://") || link.startsWith("https://"))
                  .map((_link: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>📎</span>
                    <span>첨부파일 {i + 1}</span>
                  </div>
                ))}
              </div>
              {opp.uiLink && (
                <a
                  href={opp.uiLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  SAM.gov에서 다운로드 →
                </a>
              )}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 font-semibold">액션</h3>
            <div className="space-y-2">
              <AiAnalysisPanel
                apiUrl="/api/ai/opportunity"
                body={{ opportunityId: opp.id }}
                buttonLabel="AI 입찰 분석"
                title={`${opp.title} AI 분석`}
              />
              {opp.uiLink && (
                <a
                  href={opp.uiLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-lg border border-input px-4 py-2.5 text-center text-sm font-medium hover:bg-secondary transition-colors"
                >
                  SAM.gov에서 보기
                </a>
              )}
            </div>
          </div>

          {contact && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 font-semibold">담당자 정보</h3>
              <div className="space-y-3 text-sm">
                {contact.fullName && (
                  <div>
                    <div className="text-xs text-muted-foreground">담당자</div>
                    <div className="mt-0.5 font-medium">{contact.fullName}</div>
                  </div>
                )}
                {contact.email && (
                  <div>
                    <div className="text-xs text-muted-foreground">이메일</div>
                    <div className="mt-0.5 font-mono text-primary">{contact.email}</div>
                  </div>
                )}
                {contact.phone && (
                  <div>
                    <div className="text-xs text-muted-foreground">전화</div>
                    <div className="mt-0.5 font-mono">{contact.phone}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 font-semibold">상세 정보</h3>
            <div className="space-y-3 text-sm">
              {[
                ["게시일", opp.postedDate?.toLocaleDateString("ko-KR")],
                ["마감일", opp.responseDeadline?.toLocaleDateString("ko-KR")],
                ["분류코드", opp.classificationCode],
                ["공고번호", opp.solicitationNumber],
                ["보관기한", opp.archiveDate?.toLocaleDateString("ko-KR")],
              ]
                .filter(([, v]) => v)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-xs">{value}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
