"use client";

import { useState, useTransition } from "react";
import { deleteFilterAction, toggleFilterAction } from "@/app/(dashboard)/filters/actions";
import { FilterFormModal } from "./filter-form-modal";
import type { Filter } from "./types";

export function FilterList({ filters }: { filters: Filter[] }) {
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: number) {
    if (!confirm("이 필터를 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteFilterAction(id);
    });
  }

  function handleToggle(id: number) {
    startTransition(async () => {
      await toggleFilterAction(id);
    });
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          총 {filters.length}개 필터 · 활성 {filters.filter((f) => f.isActive).length}개
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + 새 필터 만들기
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">등록된 필터가 없습니다.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            첫 필터 만들기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filters.map((filter) => (
            <div
              key={filter.id}
              className={`rounded-xl border bg-card overflow-hidden transition-colors ${
                filter.isActive ? "border-border" : "border-border opacity-60"
              }`}
            >
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${
                      filter.isActive ? "bg-success" : "bg-muted-foreground"
                    }`}
                  />
                  <div>
                    <h3 className="font-semibold">{filter.name}</h3>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                      {filter.notifyEmail && (
                        <span className="text-primary">이메일 알림 ON</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingFilter(filter)}
                    disabled={isPending}
                    className="h-8 rounded-md border border-input px-3 text-xs hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleToggle(filter.id)}
                    disabled={isPending}
                    className="h-8 rounded-md border border-input px-3 text-xs hover:bg-secondary transition-colors disabled:opacity-50"
                  >
                    {filter.isActive ? "비활성화" : "활성화"}
                  </button>
                  <button
                    onClick={() => handleDelete(filter.id)}
                    disabled={isPending}
                    className="h-8 rounded-md border border-input px-3 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>

              <div className="border-t border-border bg-secondary/30 px-6 py-3">
                <div className="flex flex-wrap gap-6 text-sm">
                  {(filter.keywords?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">키워드:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {filter.keywords!.map((kw) => (
                          <span key={kw} className="rounded bg-secondary px-2 py-0.5 text-xs font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(filter.naicsCodes?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">NAICS:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {filter.naicsCodes!.map((code) => (
                          <span key={code} className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(filter.noticeTypes?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">공고 유형:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {filter.noticeTypes!.map((type) => (
                          <span key={type} className="rounded bg-secondary px-2 py-0.5 text-xs">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(filter.setAsides?.length ?? 0) > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Set-Aside:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {filter.setAsides!.map((sa) => (
                          <span key={sa} className="rounded bg-secondary px-2 py-0.5 text-xs">
                            {sa}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <FilterFormModal onClose={() => setShowCreateModal(false)} />
      )}
      {editingFilter && (
        <FilterFormModal filter={editingFilter} onClose={() => setEditingFilter(null)} />
      )}
    </>
  );
}
