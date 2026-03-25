import Link from "next/link";
import { formatAmount } from "@/lib/utils";

interface VendorCardProps {
  rank: number;
  name: string;
  uei: string | null;
  count: number;
  totalAmount: number;
  avgAmount: number;
  competitiveWins: number;
  soleSource: number;
  competitiveRate: number;
  naics?: string[];
}

export function VendorCard({
  rank, name, uei, count, totalAmount, avgAmount,
  competitiveWins, soleSource, competitiveRate, naics,
}: VendorCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {rank}
          </span>
          <div>
            {uei ? (
              <Link href={`/awards/competitors/${uei}`} className="text-lg font-semibold hover:text-primary transition-colors">
                {name}
              </Link>
            ) : (
              <h3 className="text-lg font-semibold">{name}</h3>
            )}
            {uei && (
              <span className="text-xs font-mono text-muted-foreground">UEI: {uei}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-6 text-center">
          <div>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs text-muted-foreground">총 수주</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-500">{formatAmount(totalAmount)}</div>
            <div className="text-xs text-muted-foreground">총 금액</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{formatAmount(avgAmount)}</div>
            <div className="text-xs text-muted-foreground">평균 금액</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="p-5">
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">경쟁 유형</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1 h-3 rounded-full overflow-hidden bg-secondary">
                {competitiveRate > 0 && (
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${competitiveRate}%` }}
                  />
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>경쟁 {competitiveWins}건 ({competitiveRate}%)</span>
                <span>수의 {soleSource}건</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <h4 className="mb-3 text-sm font-medium text-muted-foreground">전문 분야</h4>
          <div className="flex flex-wrap gap-2">
            {naics && naics.length > 0 ? (
              naics.slice(0, 5).map((code) => (
                <span key={code} className="rounded-md bg-secondary px-2.5 py-1 text-xs font-mono text-primary">
                  {code}
                </span>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">데이터 없음</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
