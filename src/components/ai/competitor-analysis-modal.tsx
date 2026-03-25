"use client";

import { useState, useCallback } from "react";
import { Sparkles, X, Loader2, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatAmount } from "@/lib/utils";

interface Props {
  naicsCode: string;
  data: {
    topAwardees: {
      name: string | null;
      count: number;
      totalAmount: string;
      avgAmount: string;
      minAmount: string;
      maxAmount: string;
    }[];
    totalStats: {
      totalCount: number;
      totalAmount: string;
      avgAmount: string;
    };
    recentAwards: {
      title: string | null;
      awardeeName: string | null;
      amount: string | null;
      date: Date | null;
    }[];
  };
}

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-muted-foreground)",
];

export function CompetitorAnalysisModal({ naicsCode, data }: Props) {
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
      const res = await fetch("/api/ai/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ naicsCode }),
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
  }, [naicsCode]);

  const { topAwardees, totalStats, recentAwards } = data;

  const pieData = topAwardees.slice(0, 5).map((a) => {
    const name = a.name || "N/A";
    return {
      name: name.length > 15 ? name.slice(0, 15) + "…" : name,
      fullName: name,
      value: parseFloat(a.totalAmount) || 0,
    };
  });

  const barData = topAwardees.slice(0, 5).map((a) => {
    const name = a.name || "N/A";
    const amt = parseFloat(a.totalAmount) || 0;
    return {
      name: name.length > 12 ? name.slice(0, 12) + "…" : name,
      fullName: name,
      amount: Math.round(amt / 1_000_000 * 10) / 10,
      count: a.count,
    };
  });

  return (
    <>
      <button
        onClick={runAnalysis}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        AI 경쟁사 분석
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 px-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-6xl max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">NAICS {naicsCode} 시장 AI 분석</h3>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-secondary" aria-label="닫기">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCard
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="총 낙찰 건수"
                  value={`${totalStats.totalCount}건`}
                />
                <KpiCard
                  icon={<DollarSign className="h-4 w-4" />}
                  label="총 낙찰 금액"
                  value={formatAmount(parseFloat(totalStats.totalAmount))}
                  accent
                />
                <KpiCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="평균 낙찰 금액"
                  value={formatAmount(parseFloat(totalStats.avgAmount))}
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pie Chart */}
                <div className="rounded-lg border border-border p-4">
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">시장 점유율 (상위 5개사)</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="value"
                        nameKey="name"
                        stroke="var(--color-card)"
                        strokeWidth={2}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                        formatter={(value) => formatAmount(Number(value))}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart */}
                <div className="rounded-lg border border-border p-4">
                  <h4 className="mb-3 text-sm font-medium text-muted-foreground">업체별 낙찰 금액 ($M)</h4>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <XAxis type="number" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                        formatter={(value) => [`$${value}M`, "금액"]}
                      />
                      <Bar dataKey="amount" fill="var(--color-chart-1)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Awards Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-secondary/30">
                  <h4 className="text-sm font-medium text-muted-foreground">최근 낙찰 내역</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs text-muted-foreground">
                        <th className="px-4 py-2 font-medium">날짜</th>
                        <th className="px-4 py-2 font-medium">업체</th>
                        <th className="px-4 py-2 font-medium">제목</th>
                        <th className="px-4 py-2 font-medium text-right">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAwards.slice(0, 10).map((award, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-secondary/20">
                          <td className="px-4 py-2 font-mono text-xs whitespace-nowrap">
                            {award.date ? new Date(award.date).toLocaleDateString("ko-KR") : "N/A"}
                          </td>
                          <td className="px-4 py-2 max-w-[180px] truncate">{award.awardeeName || "N/A"}</td>
                          <td className="px-4 py-2 max-w-[300px] truncate">{award.title || "제목 없음"}</td>
                          <td className="px-4 py-2 text-right font-mono text-xs text-success whitespace-nowrap">
                            {award.amount ? formatAmount(parseFloat(award.amount)) : "N/A"}
                          </td>
                        </tr>
                      ))}
                      {recentAwards.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            데이터 없음
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="rounded-lg border border-border">
                <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <h4 className="text-sm font-medium">AI 분석 리포트</h4>
                </div>
                <div className="p-5">
                  {error ? (
                    <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
                  ) : content ? (
                    <div className="md-content text-sm leading-relaxed">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-xl font-bold mt-5 mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-2 text-primary">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
                          p: ({ children }) => <p className="mb-2">{children}</p>,
                          ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
                          ),
                          hr: () => <hr className="my-4 border-border" />,
                        }}
                      >
                        {content}
                      </ReactMarkdown>
                    </div>
                  ) : loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI가 데이터를 분석하고 있습니다...
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function KpiCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border p-4 flex items-center gap-3">
      <div className="rounded-md bg-secondary p-2 text-muted-foreground">{icon}</div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-xl font-bold ${accent ? "text-success" : ""}`}>{value}</div>
      </div>
    </div>
  );
}
