export const revalidate = 300;

import { Header } from "@/components/layout/header";
import { getNaicsPriceSummary, getPscPriceSummary } from "@/lib/services/price-analysis";
import { formatAmount } from "@/lib/utils";

export default async function PricingPage() {
  const [naicsPrice, pscPrice] = await Promise.all([
    getNaicsPriceSummary(12).catch(() => []),
    getPscPriceSummary(12).catch(() => []),
  ]);

  return (
    <>
      <Header title="가격 분석" description="NAICS/PSC별 계약 가격 추이 및 분포 분석 (최근 12개월)" />

      {naicsPrice.length === 0 && pscPrice.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          USA Spending 데이터가 없습니다. 먼저 데이터를 수집해주세요.
        </div>
      ) : (
        <>
          {/* NAICS별 가격 */}
          {naicsPrice.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">NAICS별 가격 분석 (최근 12개월)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">NAICS</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">건수</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">중간값</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">평균</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">최소</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">최대</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">총액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {naicsPrice.map((p) => (
                      <tr key={p.naicsCode} className="hover:bg-secondary/20">
                        <td className="px-4 py-3 font-mono">{p.naicsCode}</td>
                        <td className="px-4 py-3 text-xs truncate max-w-[180px]">{p.naicsDescription || "-"}</td>
                        <td className="px-4 py-3 text-right">{p.count}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">{formatAmount(p.medianAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatAmount(p.avgAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatAmount(p.minAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{formatAmount(p.maxAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-500">{formatAmount(p.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PSC별 가격 */}
          {pscPrice.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold">PSC별 가격 분석 (최근 12개월)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">PSC</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">설명</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">건수</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">중간값</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">평균</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">가격 범위</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">총액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pscPrice.map((p) => (
                      <tr key={p.psc} className="hover:bg-secondary/20">
                        <td className="px-4 py-3 font-mono">{p.psc}</td>
                        <td className="px-4 py-3 text-xs truncate max-w-[180px]">{p.pscDescription || "-"}</td>
                        <td className="px-4 py-3 text-right">{p.count}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold">{formatAmount(p.medianAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatAmount(p.avgAmount)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                          {formatAmount(p.minAmount)} ~ {formatAmount(p.maxAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-500">{formatAmount(p.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
