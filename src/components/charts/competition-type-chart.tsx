"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatAmount } from "@/lib/utils";

interface CompetitionData {
  type: string;
  count: number;
  amount: number;
}

const COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

export function CompetitionTypeChart({ data }: { data: CompetitionData[] }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">데이터 없음</div>;
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const chartData = data.map((d) => ({
    ...d,
    pct: total > 0 ? Math.round((d.count / total) * 1000) / 10 : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="type"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={((props: unknown) => {
            const p = props as { type?: string; pct?: number };
            return `${p.type ?? ""} ${p.pct ?? 0}%`;
          }) as never}
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value}건`, name]}
          contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }}
          labelStyle={{ color: "var(--color-foreground)" }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
