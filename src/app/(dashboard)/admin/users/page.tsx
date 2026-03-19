export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/header";
import { getUsers, getSyncLogs, getSystemStats } from "@/lib/services/admin";
import { getAdminSession } from "@/lib/get-session";
import { UserActions } from "./user-actions";
import { AddUserForm } from "./add-user-form";

export default async function AdminUsersPage() {
  await getAdminSession();

  const [userList, logs, stats] = await Promise.all([
    getUsers(),
    getSyncLogs(10),
    getSystemStats(),
  ]);

  const systemStats = [
    { label: "총 공고 수", value: stats.totalOpps.toLocaleString() },
    { label: "총 낙찰 수", value: stats.totalAwards.toLocaleString() },
    { label: "총 사용자", value: stats.totalUsers.toLocaleString() },
    { label: "마지막 수집", value: stats.lastSync?.startedAt?.toLocaleString("ko-KR") || "없음" },
  ];

  return (
    <>
      <Header title="관리자" description="시스템 관리 및 모니터링" />

      {/* System Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">{stat.label}</div>
            <div className="mt-1 text-xl font-bold font-mono">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="mb-8 rounded-xl border border-border bg-card overflow-x-auto">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold">사용자 목록</h3>
          <AddUserForm />
        </div>
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">이름</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">이메일</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">역할</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">최근 로그인</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">상태</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {userList.map((user) => (
              <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-medium">{user.name}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{user.email}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    {user.role === "admin" ? "관리자" : "사용자"}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                  {user.lastLoginAt?.toLocaleString("ko-KR") || "-"}
                </td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.isActive ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {user.isActive ? "활성" : "비활성"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <UserActions userId={user.id} isActive={user.isActive} role={user.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sync Logs */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <div className="border-b border-border px-5 py-3">
          <h3 className="font-semibold">최근 수집 로그</h3>
        </div>
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">시각</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">유형</th>
              <th className="px-5 py-3 text-left font-medium text-muted-foreground">상태</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">조회</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">신규</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">갱신</th>
              <th className="px-5 py-3 text-right font-medium text-muted-foreground">소요시간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">수집 이력이 없습니다.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                    {log.startedAt.toLocaleString("ko-KR")}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                      {log.apiType === "opportunities" ? "공고" : "낙찰"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      log.status === "success" ? "bg-success/10 text-success" :
                      log.status === "failed" ? "bg-destructive/10 text-destructive" :
                      "bg-warning/10 text-warning"
                    }`}>
                      {log.status === "success" ? "성공" : log.status === "failed" ? "실패" : "실행중"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs">{log.recordsFetched}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-success">
                    {log.recordsNew ? `+${log.recordsNew}` : ""}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs">
                    {log.recordsUpdated || ""}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">
                    {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
