"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatAmount } from "@/lib/utils";

interface TimelineData {
  month: string;
  count: number;
  amount: number;
}

export function VendorTimelineChart({ data }: { data: TimelineData[] }) {
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">데이터 없음</div>;
  }

  const chartData = data.map((d) => ({
    ...d,
    amountM: d.amount / 1_000_000,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border))" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground))" }}
          tickFormatter={(v) => v.slice(5)}
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground))" }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground))" }}
          tickFormatter={(v) => `$${v}M`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "var(--color-card))", border: "1px solid var(--color-border))", borderRadius: "8px" }}
          formatter={(value, name) =>
            name === "amountM" ? [formatAmount(Number(value) * 1_000_000), "금액"] : [`${value}건`, "수주 건수"]
          }
          labelFormatter={(label) => `${label}`}
        />
        <Area
          yAxisId="left"
          type="monotone"
          dataKey="count"
          stroke="var(--color-chart-1))"
          fill="var(--color-chart-1))"
          fillOpacity={0.2}
          name="수주 건수"
        />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="amountM"
          stroke="var(--color-chart-2))"
          fill="var(--color-chart-2))"
          fillOpacity={0.1}
          name="amountM"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
