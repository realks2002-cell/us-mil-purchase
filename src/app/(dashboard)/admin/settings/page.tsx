import { Header } from "@/components/layout/header";

export default function SettingsPage() {
  return (
    <>
      <Header title="시스템 설정" description="시스템 환경설정 관리" />

      <div className="max-w-2xl space-y-6">
        {/* SAM.gov API Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">SAM.gov API 설정</h3>
          <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3 text-sm">
            <div>
              <div className="font-medium">API Key</div>
              <div className="text-xs text-muted-foreground">
                환경변수(SAM_GOV_API_KEY)로 관리됩니다. 변경 시 서버 재배포가 필요합니다.
              </div>
            </div>
            <span className="rounded-md bg-success/10 px-2.5 py-1 text-xs font-medium text-success">설정됨</span>
          </div>
        </div>

        {/* Cron Schedule */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">수집 스케줄</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3">
              <div>
                <div className="font-medium">입찰 공고 수집</div>
                <div className="text-xs text-muted-foreground">SAM.gov Opportunities API</div>
              </div>
              <span className="rounded-md bg-secondary px-2.5 py-1 font-mono text-xs">매시 정각</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3">
              <div>
                <div className="font-medium">낙찰 데이터 수집</div>
                <div className="text-xs text-muted-foreground">SAM.gov Awards API</div>
              </div>
              <span className="rounded-md bg-secondary px-2.5 py-1 font-mono text-xs">매일 06:00 UTC</span>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold">시스템 정보</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">버전</dt>
              <dd className="font-mono">1.0.0</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">환경</dt>
              <dd className="font-mono">{process.env.NODE_ENV || "development"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
