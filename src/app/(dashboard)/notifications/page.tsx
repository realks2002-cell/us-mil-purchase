import { Header } from "@/components/layout/header";
import { getRequiredSession } from "@/lib/get-session";
import { getRecentNotifications } from "@/lib/services/notifications";
import Link from "next/link";

const typeLabels: Record<string, { label: string; style: string }> = {
  new_match: { label: "신규 매칭", style: "bg-primary/10 text-primary" },
  deadline_warning: { label: "마감 임박", style: "bg-warning/10 text-warning" },
  status_change: { label: "상태 변경", style: "bg-blue-500/10 text-blue-500" },
};

const statusLabels: Record<string, { label: string; style: string }> = {
  sent: { label: "발송완료", style: "bg-success/10 text-success" },
  pending: { label: "대기중", style: "bg-warning/10 text-warning" },
  failed: { label: "실패", style: "bg-destructive/10 text-destructive" },
};

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default async function NotificationsPage() {
  const session = await getRequiredSession();
  const notifications = await getRecentNotifications(session.user.id!, 50);

  return (
    <>
      <Header title="알림" description="필터 매칭 알림 이력 및 설정" />

      {/* Settings Card */}
      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 font-semibold">알림 설정</h3>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">이메일 알림</span>
              <div className="h-5 w-9 rounded-full bg-primary relative">
                <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              매칭 공고 발견 시 이메일 발송
            </div>
            <div className="mt-2 text-xs font-mono text-muted-foreground">
              {session.user.email}
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">마감 임박 알림</span>
              <div className="h-5 w-9 rounded-full bg-primary relative">
                <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              마감 7일 전 알림 발송
            </div>
            <select className="mt-2 h-8 w-full rounded border border-input bg-background px-2 text-xs">
              <option>마감 7일 전</option>
              <option>마감 3일 전</option>
              <option>마감 14일 전</option>
            </select>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">일일 요약</span>
              <div className="h-5 w-9 rounded-full bg-muted relative">
                <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              매일 아침 전일 수집 요약 발송
            </div>
            <select className="mt-2 h-8 w-full rounded border border-input bg-background px-2 text-xs" disabled>
              <option>매일 08:00</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification History */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-semibold">알림 이력</h3>
          <span className="text-xs text-muted-foreground">총 {notifications.length}건</span>
        </div>

        {notifications.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            알림 이력이 없습니다. 맞춤 필터를 설정하면 매칭 공고 알림을 받을 수 있습니다.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">유형</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">공고</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">채널</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">상태</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">읽음</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">생성 시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notifications.map((n) => {
                const typeInfo = typeLabels[n.type] ?? typeLabels.new_match;
                const statusInfo = statusLabels[n.status] ?? statusLabels.pending;
                return (
                  <tr key={n.id} className={`hover:bg-secondary/30 transition-colors ${!n.readAt ? "bg-primary/5" : ""}`}>
                    <td className="px-5 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs ${typeInfo.style}`}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {n.opportunityId ? (
                        <Link href={`/opportunities/${n.opportunityId}`} className="hover:underline">
                          <div className="max-w-xs truncate">{n.opportunityTitle ?? n.subject}</div>
                          {n.opportunityNoticeId && (
                            <div className="text-xs font-mono text-muted-foreground">{n.opportunityNoticeId}</div>
                          )}
                        </Link>
                      ) : (
                        <div className="max-w-xs truncate">{n.subject}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs">📧 이메일</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.style}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {n.readAt ? "✓" : "-"}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {formatDate(n.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
