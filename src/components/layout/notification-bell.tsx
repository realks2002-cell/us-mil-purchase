"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  });

const typeLabels: Record<string, { label: string; style: string }> = {
  new_match: { label: "신규 매칭", style: "bg-primary/10 text-primary" },
  deadline_warning: { label: "마감 임박", style: "bg-warning/10 text-warning" },
  status_change: { label: "상태 변경", style: "bg-blue-500/10 text-blue-500" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data, mutate } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const unreadCount: number = data?.unreadCount ?? 0;
  const items: Array<{
    id: number;
    type: string;
    subject: string;
    readAt: string | null;
    createdAt: string;
    opportunityId: number | null;
    opportunityTitle: string | null;
    opportunityNoticeId: string | null;
  }> = data?.notifications?.slice(0, 5) ?? [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    mutate();
  }

  async function handleItemClick(id: number) {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg border border-input p-2 hover:bg-secondary"
        aria-label={unreadCount > 0 ? `알림 ${unreadCount}건` : "알림 없음"}
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">알림</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Check className="h-3 w-3" />
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                알림이 없습니다
              </div>
            ) : (
              items.map((item) => {
                const typeInfo = typeLabels[item.type] ?? typeLabels.new_match;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`cursor-pointer border-b border-border px-4 py-3 hover:bg-secondary/50 transition-colors ${
                      !item.readAt ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${typeInfo.style}`}>
                            {typeInfo.label}
                          </span>
                          {!item.readAt && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="truncate text-sm">{item.subject}</p>
                        {item.opportunityNoticeId && (
                          <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                            {item.opportunityNoticeId}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>
                    {item.opportunityId && (
                      <Link
                        href={`/opportunities/${item.opportunityId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        공고 상세 <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-border px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              전체 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
