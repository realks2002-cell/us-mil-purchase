"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyData {
  month: string;
  count: number;
  amount: number;
}

export function MonthlyTrendChart({ data }: { data: MonthlyData[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: d.month.slice(5), // "MM" only
    amountM: Math.round(d.amount / 1_000_000 * 10) / 10,
  }));

  if (formatted.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        낙찰 데이터가 없습니다.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <XAxis dataKey="label" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
        <YAxis yAxisId="count" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} width={30} />
        <YAxis yAxisId="amount" orientation="right" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} width={40} />
        <Tooltip
          contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "var(--color-foreground)" }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar yAxisId="count" dataKey="count" name="건수" fill="var(--color-chart-1)" radius={[2, 2, 0, 0]} />
        <Bar yAxisId="amount" dataKey="amountM" name="금액($M)" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
