import { Header } from "@/components/layout/header";

const notifications = [
  {
    id: 1,
    title: "Camp Humphreys Base Operations Support Services",
    noticeId: "FA5209-24-R-0012",
    filter: "캠프 험프리스 시설관리",
    channel: "email",
    status: "sent",
    sentAt: "2024-03-19 09:31",
    type: "new_match",
  },
  {
    id: 2,
    title: "USFK IT Infrastructure Modernization Program",
    noticeId: "W91QV1-24-R-0033",
    filter: "IT/통신 프로젝트",
    channel: "email",
    status: "sent",
    sentAt: "2024-03-19 09:30",
    type: "new_match",
  },
  {
    id: 3,
    title: "Camp Casey Facility Renovation Phase III",
    noticeId: "W912UM-24-R-0045",
    filter: "건설/리노베이션",
    channel: "email",
    status: "sent",
    sentAt: "2024-03-18 14:22",
    type: "deadline_warning",
  },
  {
    id: 4,
    title: "Korea-Wide Janitorial and Custodial Services",
    noticeId: "FA5209-24-R-0022",
    filter: "캠프 험프리스 시설관리",
    channel: "email",
    status: "sent",
    sentAt: "2024-03-18 09:30",
    type: "deadline_warning",
  },
  {
    id: 5,
    title: "Naval Fleet Activities Chinhae Waterfront Repair",
    noticeId: "N62742-24-R-0021",
    filter: "건설/리노베이션",
    channel: "email",
    status: "failed",
    sentAt: "2024-03-17 16:02",
    type: "new_match",
  },
  {
    id: 6,
    title: "Camp Humphreys Water Treatment Facility",
    noticeId: "W912UM-24-R-0052",
    filter: "환경/에너지",
    channel: "email",
    status: "sent",
    sentAt: "2024-03-17 09:31",
    type: "new_match",
  },
];

const typeLabels: Record<string, string> = {
  new_match: "신규 매칭",
  deadline_warning: "마감 임박",
  status_change: "상태 변경",
};

const statusLabels: Record<string, { label: string; style: string }> = {
  sent: { label: "발송완료", style: "bg-success/10 text-success" },
  pending: { label: "대기중", style: "bg-warning/10 text-warning" },
  failed: { label: "실패", style: "bg-destructive/10 text-destructive" },
};

export default function NotificationsPage() {
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
              kim@company.com
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
          <div className="flex items-center gap-2">
            <select className="h-8 rounded border border-input bg-background px-2 text-xs">
              <option>전체 유형</option>
              <option>신규 매칭</option>
              <option>마감 임박</option>
              <option>상태 변경</option>
            </select>
            <select className="h-8 rounded border border-input bg-background px-2 text-xs">
              <option>전체 상태</option>
              <option>발송완료</option>
              <option>실패</option>
            </select>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">유형</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">공고</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">필터</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">채널</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">상태</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">발송 시각</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {notifications.map((n) => (
              <tr key={n.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs ${
                    n.type === "deadline_warning" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                  }`}>
                    {typeLabels[n.type]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="max-w-xs truncate">{n.title}</div>
                  <div className="text-xs font-mono text-muted-foreground">{n.noticeId}</div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{n.filter}</td>
                <td className="px-5 py-3 text-xs">📧 이메일</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusLabels[n.status].style}`}>
                    {statusLabels[n.status].label}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{n.sentAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
