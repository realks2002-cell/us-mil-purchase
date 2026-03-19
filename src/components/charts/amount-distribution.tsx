"use client";

interface RangeData {
  range: string;
  count: number;
  pct: number;
}

export function AmountDistributionChart({ data }: { data: RangeData[] }) {
  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        낙찰 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((range) => (
        <div key={range.range} className="flex items-center gap-3">
          <span className="w-28 text-sm font-mono text-muted-foreground">{range.range}</span>
          <div className="flex-1 h-6 rounded-md bg-secondary overflow-hidden">
            <div
              className="h-full rounded-md bg-chart-1 transition-all"
              style={{ width: `${Math.max(range.pct, 1)}%` }}
            />
          </div>
          <span className="w-16 text-right text-sm font-mono">{range.count}건</span>
          <span className="w-12 text-right text-xs text-muted-foreground">{range.pct}%</span>
        </div>
      ))}
    </div>
  );
}
