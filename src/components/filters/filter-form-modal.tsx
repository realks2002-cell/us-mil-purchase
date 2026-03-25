"use client";

import { useEffect, useTransition } from "react";
import { createFilterAction, updateFilterAction } from "@/app/(dashboard)/filters/actions";
import type { Filter } from "./types";

const NOTICE_TYPES = [
  "Solicitation",
  "Presolicitation",
  "Combined Synopsis/Solicitation",
  "Sources Sought",
];

const SET_ASIDES = [
  "Full and Open",
  "Small Business",
  "8(a)",
  "HUBZone",
  "SDVOSB",
  "WOSB",
];

export function FilterFormModal({
  filter,
  onClose,
}: {
  filter?: Filter;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEdit = !!filter;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = isEdit
        ? await updateFilterAction(filter!.id, formData)
        : await createFilterAction(formData);

      if (result.ok) {
        onClose();
      } else if (result.error) {
        alert(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-6 text-lg font-semibold">
          {isEdit ? "필터 수정" : "새 필터 만들기"}
        </h3>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">필터 이름</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={filter?.name ?? ""}
              placeholder="예: 캠프 험프리스 건설"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">키워드 (쉼표 구분)</label>
              <input
                name="keywords"
                type="text"
                defaultValue={filter?.keywords?.join(", ") ?? ""}
                placeholder="Camp Humphreys, construction"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">NAICS 코드 (쉼표 구분)</label>
              <input
                name="naicsCodes"
                type="text"
                defaultValue={filter?.naicsCodes?.join(", ") ?? ""}
                placeholder="236220, 238220"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">공고 유형</label>
            <div className="flex flex-wrap gap-3">
              {NOTICE_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`noticeType_${type}`}
                    defaultChecked={filter?.noticeTypes?.includes(type) ?? false}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Set-Aside</label>
            <div className="flex flex-wrap gap-3">
              {SET_ASIDES.map((sa) => (
                <label key={sa} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name={`setAside_${sa}`}
                    defaultChecked={filter?.setAsides?.includes(sa) ?? false}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {sa}
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={filter?.isActive ?? true}
                className="h-4 w-4 rounded accent-primary"
              />
              필터 활성화
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="notifyEmail"
                defaultChecked={filter?.notifyEmail ?? true}
                className="h-4 w-4 rounded accent-primary"
              />
              이메일 알림 수신
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-input px-4 text-sm hover:bg-secondary transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "저장 중..." : isEdit ? "수정" : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
