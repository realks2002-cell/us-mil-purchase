"use client";

import { useState, useCallback } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";

interface Props {
  apiUrl: string;
  body: Record<string, unknown>;
  buttonLabel?: string;
  title?: string;
}

export function AiAnalysisPanel({ apiUrl, body, buttonLabel = "AI 분석", title = "AI 분석 리포트" }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const runAnalysis = useCallback(async () => {
    setOpen(true);
    setLoading(true);
    setContent("");
    setError("");

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(text || `분석 실패 (${res.status})`);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("스트리밍을 지원하지 않습니다.");
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setContent(result);
      }

      if (!result.trim()) {
        setError("AI 응답이 비어있습니다. 잠시 후 다시 시도해주세요.");
      }
      setLoading(false);
    } catch {
      setError("AI 분석 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }, [apiUrl, body]);

  return (
    <>
      <button
        onClick={runAnalysis}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-3xl max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">{title}</h3>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-secondary" aria-label="닫기">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6">
              {error ? (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
              ) : content ? (
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {content}
                </div>
              ) : loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  데이터를 분석하고 있습니다...
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
