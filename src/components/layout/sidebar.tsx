"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  BarChart3,
  Building2,
  SlidersHorizontal,
  Bell,
  Users,
  Settings,
  Radio,
  Menu,
  X,
  TrendingUp,
  Target,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

type NavItem = { name: string; href: string; icon: LucideIcon };

const navigation: NavItem[] = [
  { name: "대시보드", href: "/", icon: LayoutDashboard },
  { name: "입찰 공고", href: "/opportunities", icon: FileText },
  { name: "낙찰 분석", href: "/awards", icon: BarChart3 },
  { name: "경쟁사 분석", href: "/awards/competitors", icon: Building2 },
  { name: "발주 패턴", href: "/analysis/patterns", icon: TrendingUp },
  { name: "유망 분야", href: "/analysis/sectors", icon: Target },
  { name: "가격 분석", href: "/analysis/pricing", icon: DollarSign },
  { name: "맞춤 필터", href: "/filters", icon: SlidersHorizontal },
  { name: "알림", href: "/notifications", icon: Bell },
];

const adminNavigation: NavItem[] = [
  { name: "사용자 관리", href: "/admin/users", icon: Users },
  { name: "시스템 설정", href: "/admin/settings", icon: Settings },
  { name: "수집 모니터링", href: "/admin/sync", icon: Radio },
];

function NavLink({ item, pathname, onClick }: { item: NavItem; pathname: string; onClick?: () => void }) {
  const Icon = item.icon;
  const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {item.name}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const userName = session?.user?.name || "사용자";
  const userInitials = userName.slice(0, 2);

  const sidebarContent = (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            US
          </div>
          <div>
            <div className="text-sm font-semibold">USFK Procurement</div>
            <div className="text-xs text-muted-foreground">Intelligence Platform</div>
          </div>
        </div>
        <button
          className="md:hidden rounded-md p-1 hover:bg-secondary"
          onClick={() => setOpen(false)}
          aria-label="메뉴 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="메인 내비게이션">
        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          메인
        </div>
        {navigation.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setOpen(false)} />
        ))}

        {session?.user?.role === "admin" && (
          <>
            <div className="mb-2 mt-6 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              관리자
            </div>
            {adminNavigation.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setOpen(false)} />
            ))}
          </>
        )}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{userName}</div>
            <div className="text-xs text-muted-foreground">{session?.user?.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed left-4 top-4 z-50 rounded-lg border border-border bg-card p-2 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border bg-card transition-transform md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:left-0 md:top-0 md:z-40 md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-border md:bg-card">
        {sidebarContent}
      </aside>
    </>
  );
}
