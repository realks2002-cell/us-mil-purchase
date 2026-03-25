"use client";

import { useTransition, useState } from "react";
import { triggerSyncOpportunities, triggerSyncAwards, triggerSyncUsaspending } from "./actions";

interface SyncResult {
  success: boolean;
  message: string;
}

export function SyncButtons() {
  const [oppPending, startOppTransition] = useTransition();
  const [awardPending, startAwardTransition] = useTransition();
  const [usaPending, startUsaTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  function handleSyncOpportunities() {
    setResult(null);
    startOppTransition(async () => {
      const res = await triggerSyncOpportunities();
      if (res.success) {
        setResult({
          success: true,
          message: `공고 수집 완료 — 수집: ${res.fetched}건, 신규: ${res.newCount}건, 갱신: ${res.updatedCount}건`,
        });
      } else {
        setResult({ success: false, message: `공고 수집 실패: ${res.error}` });
      }
    });
  }

  function handleSyncAwards() {
    setResult(null);
    startAwardTransition(async () => {
      const res = await triggerSyncAwards();
      if (res.success) {
        setResult({
          success: true,
          message: `낙찰 수집 완료 — 수집: ${res.fetched}건, 신규: ${res.newCount}건`,
        });
      } else {
        setResult({ success: false, message: `낙찰 수집 실패: ${res.error}` });
      }
    });
  }

  function handleSyncUsaspending() {
    setResult(null);
    startUsaTransition(async () => {
      const res = await triggerSyncUsaspending();
      if (res.success) {
        setResult({
          success: true,
          message: `USA Spending 수집 완료 — 수집: ${res.fetched}건, 신규: ${res.newCount}건, 상세보강: ${res.detailsEnriched}건`,
        });
      } else {
        setResult({ success: false, message: `USA Spending 수집 실패: ${res.error}` });
      }
    });
  }

  const isPending = oppPending || awardPending || usaPending;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex items-center gap-2">
        <button
          onClick={handleSyncOpportunities}
          disabled={isPending}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {oppPending && <Spinner />}
          공고 수집
        </button>
        <button
          onClick={handleSyncAwards}
          disabled={isPending}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          {awardPending && <Spinner />}
          낙찰 수집
        </button>
        <button
          onClick={handleSyncUsaspending}
          disabled={isPending}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-secondary disabled:opacity-50"
        >
          {usaPending && <Spinner />}
          USA Spending
        </button>
      </div>

      {result && (
        <p
          className={`text-sm ${result.success ? "text-emerald-500" : "text-destructive"}`}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
