"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Vendor {
  name: string;
  uei: string | null;
}

export function VendorSelector({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const [ueiA, setUeiA] = useState("");
  const [ueiB, setUeiB] = useState("");

  function handleCompare() {
    if (ueiA && ueiB && ueiA !== ueiB) {
      router.push(`/awards/competitors/compare?a=${ueiA}&b=${ueiB}`);
    }
  }

  const vendorsWithUei = vendors.filter((v) => v.uei);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium text-muted-foreground">업체 A</label>
        <select
          value={ueiA}
          onChange={(e) => setUeiA(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">선택하세요</option>
          {vendorsWithUei.map((v) => (
            <option key={v.uei} value={v.uei!} disabled={v.uei === ueiB}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-center text-muted-foreground font-bold">VS</div>
      <div className="flex-1">
        <label className="mb-1.5 block text-sm font-medium text-muted-foreground">업체 B</label>
        <select
          value={ueiB}
          onChange={(e) => setUeiB(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">선택하세요</option>
          {vendorsWithUei.map((v) => (
            <option key={v.uei} value={v.uei!} disabled={v.uei === ueiA}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={handleCompare}
        disabled={!ueiA || !ueiB || ueiA === ueiB}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        비교 분석
      </button>
    </div>
  );
}
