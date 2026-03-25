export const dynamic = "force-dynamic";

import { SyncButtons } from "./sync-buttons";
import { db } from "@/lib/db";
import { syncLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export default async function SyncMonitorPage() {
  const logs = await db
    .select()
    .from(syncLogs)
    .orderBy(desc(syncLogs.startedAt))
    .limit(50)
    .catch(() => []);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">수집 모니터링</h1>
          <p className="mt-1 text-sm text-muted-foreground">SAM.gov / USA Spending 데이터 수집 현황 및 로그</p>
        </div>
        <SyncButtons />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">유형</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">수집</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">신규</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">갱신</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">소요(ms)</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">시작 시간</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">에러</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    수집 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{log.id}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                        {log.apiType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.status === "success"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : log.status === "failed"
                              ? "bg-destructive/10 text-destructive"
                              : "bg-yellow-500/10 text-yellow-600"
                        }`}
                      >
                        {log.status === "success" ? "성공" : log.status === "failed" ? "실패" : "실행중"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{log.recordsFetched ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-mono">{log.recordsNew ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-mono">{log.recordsUpdated ?? "-"}</td>
                    <td className="px-4 py-3 text-right font-mono">{log.duration ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {log.startedAt ? new Date(log.startedAt).toLocaleString("ko-KR") : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-destructive max-w-[200px] truncate">
                      {log.errorMessage || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
