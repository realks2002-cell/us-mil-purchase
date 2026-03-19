"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";

const noticeTypes = ["전체", "Solicitation", "Presolicitation", "Combined Synopsis", "Sources Sought"];
const statuses = ["전체", "진행중", "마감임박", "마감"];

interface Props {
  naicsCodes: string[];
  total: number;
  currentSearch: string;
  currentType: string;
  currentStatus: string;
  currentNaics: string;
}

export function OpportunitySearch({
  naicsCodes,
  total,
  currentSearch,
  currentType,
  currentStatus,
  currentNaics,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(window.location.search);
      if (value && value !== "전체") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname]
  );

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          updateFilter("search", fd.get("search") as string);
        }}
      >
        <input
          name="search"
          type="text"
          defaultValue={currentSearch}
          placeholder="공고명, NAICS, 기관명 검색..."
          aria-label="공고 검색"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-80"
        />
      </form>
      <select
        aria-label="공고 유형 필터"
        defaultValue={currentType || "전체"}
        onChange={(e) => updateFilter("type", e.target.value)}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
      >
        {noticeTypes.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>
      <select
        aria-label="상태 필터"
        defaultValue={currentStatus || "전체"}
        onChange={(e) => updateFilter("status", e.target.value)}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
      >
        {statuses.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <select
        aria-label="NAICS 코드 필터"
        defaultValue={currentNaics || "전체"}
        onChange={(e) => updateFilter("naics", e.target.value)}
        className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
      >
        <option value="전체">NAICS 전체</option>
        {naicsCodes.map((code) => (
          <option key={code} value={code}>{code}</option>
        ))}
      </select>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-muted-foreground">총 {total}건</span>
      </div>
    </div>
  );
}
