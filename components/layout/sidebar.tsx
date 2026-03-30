"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ReceiptText, Target, WalletCards, FileBadge2, Settings, FileText, HandCoins, TrendingUp, Repeat2, UserCircle2 } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { useBudgetlyStore } from "@/lib/store";
import { cn } from "@/utils/cn";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/budgets", label: "Budgets", icon: WalletCards },
  { href: "/invoice", label: "Invoice", icon: FileBadge2 },
  { href: "/debts", label: "Debt & Receivables", icon: HandCoins },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat2 },
  { href: "/reports", label: "Reports", icon: FileText },
];

export const bottomNavItems = [
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLink({ href, label, icon: Icon, active, collapsed }: { href: string; label: string; icon: React.ElementType; active: boolean; collapsed?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
        collapsed ? "justify-center" : "gap-3",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed ? label : null}
    </Link>
  );
}

export function SidebarNav({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {!collapsed ? (
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Menu
          </p>
        ) : null}
        {navItems.map((item) => (
          <div key={item.href} onClick={onNavigate}>
            <NavLink href={item.href} label={item.label} icon={item.icon} active={pathname.startsWith(item.href)} collapsed={collapsed} />
          </div>
        ))}
      </nav>
      <div className="mt-auto border-t border-sidebar-border px-3 py-4">
        {bottomNavItems.map((item) => (
          <div key={item.href} onClick={onNavigate}>
            <NavLink href={item.href} label={item.label} icon={item.icon} active={pathname.startsWith(item.href)} collapsed={collapsed} />
          </div>
        ))}
      </div>
    </>
  );
}

export function Sidebar() {
  const collapsed = useBudgetlyStore((state) => state.sidebarCollapsed);

  return (
    <aside className={cn("hidden shrink-0 border-r border-sidebar-border bg-sidebar transition-[width] duration-200 xl:flex xl:flex-col", collapsed ? "w-[84px]" : "w-[260px]")}>
      <div className={cn("flex h-14 items-center border-b border-sidebar-border", collapsed ? "justify-center px-3" : "gap-2 px-6")}>
        <Logo compact={collapsed} />
      </div>
      <SidebarNav collapsed={collapsed} />
      {!collapsed ? (
        <div className="border-t border-sidebar-border px-4 py-3 text-left text-[11px] text-muted-foreground">
          Made with Codex by{" "}
          <a
            href="https://github.com/rasmadibnu/budgetly"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-foreground"
          >
            Rasmad Ibnu
          </a>
        </div>
      ) : null}
    </aside>
  );
}
