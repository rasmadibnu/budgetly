"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, EyeOff, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, Sun, WifiOff } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { logoutAction } from "@/features/auth/server/actions";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import { formatMonthLabel } from "@/utils/format";
import { useOfflineStatus } from "@/hooks/use-offline-status";
import { useMobile } from "@/hooks/use-mobile";
import { normalizeMonthKey } from "@/utils/date";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar";
import { useBudgetlyStore } from "@/lib/store";
import type { CategoryOption } from "@/types/app";

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();

  for (let i = -12; i <= 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: formatMonthLabel(`${value}-01`) });
  }

  return options;
}

function shiftMonth(current: string, delta: number): string {
  const [y, m] = current.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function capitalizeUsername(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function Topbar({ username, categories }: { username: string; categories: CategoryOption[] }) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [tabletNavOpen, setTabletNavOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const offline = useOfflineStatus();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = useMobile();
  const displayName = capitalizeUsername(username);
  const initials = displayName.slice(0, 2).toUpperCase();
  const month = normalizeMonthKey(searchParams.get("month"));
  const amountsVisible = useBudgetlyStore((state) => state.amountsVisible);
  const toggleAmountsVisible = useBudgetlyStore((state) => state.toggleAmountsVisible);
  const sidebarCollapsed = useBudgetlyStore((state) => state.sidebarCollapsed);
  const toggleSidebarCollapsed = useBudgetlyStore((state) => state.toggleSidebarCollapsed);
  const monthOptions = useMemo(getMonthOptions, []);

  const onMonthChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("month", value);
    } else {
      params.delete("month");
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  return (
    <header className="shrink-0 border-b px-4 sm:px-6 lg:px-8">
      <TransactionFormDialog open={transactionOpen} onOpenChange={setTransactionOpen} categories={categories} />
      {isMobile ? (
        <Sheet open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
          <SheetContent side="bottom" className="h-auto w-full max-w-none">
            <SheetHeader>
              <SheetTitle>Select month</SheetTitle>
            </SheetHeader>
            <div className="grid max-h-[65dvh] gap-2 overflow-y-auto px-5 py-4 pb-6">
              {monthOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={option.value === month ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => {
                    onMonthChange(option.value);
                    setMonthPickerOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select month</DialogTitle>
              <DialogDescription>Choose the active reporting month for the current view.</DialogDescription>
            </DialogHeader>
            <div className="grid max-h-[60vh] gap-2 overflow-y-auto sm:grid-cols-2">
              {monthOptions.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={option.value === month ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => {
                    onMonthChange(option.value);
                    setMonthPickerOpen(false);
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
      <div className="flex min-h-14 flex-col gap-0 md:flex-row md:items-center md:justify-between md:gap-3">
        <div className="flex min-h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sheet open={tabletNavOpen} onOpenChange={setTabletNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden h-8 w-8 shrink-0 md:inline-flex xl:hidden"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0">
                <SheetHeader>
                  <div className="flex items-center gap-3">
                    <Logo />
                  </div>
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                </SheetHeader>
                <div className="flex h-[calc(100dvh-73px)] flex-col overflow-y-auto">
                  <SidebarNav onNavigate={() => setTabletNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex min-w-0 items-center gap-0.5 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onMonthChange(shiftMonth(month, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 min-w-0 px-2 text-[13px] font-semibold"
                onClick={() => setMonthPickerOpen(true)}
              >
                <span className="truncate">{formatMonthLabel(`${month}-01`)}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onMonthChange(shiftMonth(month, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="hidden min-w-0 items-center gap-1 sm:gap-1.5 lg:flex">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={toggleSidebarCollapsed}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onMonthChange(shiftMonth(month, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 min-w-0 px-2 text-[13px] font-semibold"
                onClick={() => setMonthPickerOpen(true)}
              >
                <span className="truncate">{formatMonthLabel(`${month}-01`)}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onMonthChange(shiftMonth(month, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAmountsVisible}
              aria-label={amountsVisible ? "Hide money amounts" : "Show money amounts"}
              className="h-8 w-8"
            >
              {amountsVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() => startTransition(() => logoutAction())}
              aria-label="Log out"
              className="h-8 w-8 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 md:flex">
            {offline ? (
              <Badge variant="warning" className="gap-1.5">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTransactionOpen(true)}
              aria-label="Add transaction"
              className="h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAmountsVisible}
              aria-label={amountsVisible ? "Hide money amounts" : "Show money amounts"}
              className="h-8 w-8"
            >
              {amountsVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="h-8 w-8"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="mx-1 h-6 w-px bg-border" />
            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-[13px] font-medium leading-none">{displayName}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Member</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              disabled={isPending}
              onClick={() => startTransition(() => logoutAction())}
              aria-label="Log out"
              className="h-8 w-8 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
