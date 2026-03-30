"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Menu, Moon, Sun, WifiOff } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { logoutAction } from "@/features/auth/server/actions";
import { formatMonthLabel } from "@/utils/format";
import { useOfflineStatus } from "@/hooks/use-offline-status";
import { normalizeMonthKey } from "@/utils/date";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar";

function getMonthOptions() {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = -12; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: formatMonthLabel(`${value}-01`) });
  }
  return options;
}

function shiftMonth(current: string, delta: number): string {
  const [y, m] = current.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function Topbar({ email }: { email: string }) {
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const offline = useOfflineStatus();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initials = email.slice(0, 2).toUpperCase();
  const month = normalizeMonthKey(searchParams.get("month"));
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
    <header className="shrink-0 border-b px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 lg:hidden" aria-label="Open navigation menu">
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
                  <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="lg:hidden">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Active month
              </p>
              <p className="text-sm font-semibold">{formatMonthLabel(`${month}-01`)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:hidden">
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
          <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onMonthChange(shiftMonth(month, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select value={month} onValueChange={onMonthChange}>
              <SelectTrigger className="h-9 w-[140px] border-0 bg-transparent px-2 text-[13px] font-semibold shadow-none focus:ring-0 sm:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <p className="text-[13px] font-medium leading-none">{email}</p>
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
