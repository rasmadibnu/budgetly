"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Grid2x2, ReceiptText, FileText, Ellipsis, Plus, Target, FileBadge2, HandCoins, TrendingUp, Repeat2, UserCircle2, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import type { CategoryOption } from "@/types/app";
import { cn } from "@/utils/cn";

const leadingItems = [
  { href: "/dashboard", label: "Home", icon: Grid2x2 },
  { href: "/transactions", label: "Transactions", icon: ReceiptText }
] as const;

const trailingItems = [
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "More", icon: Ellipsis }
] as const;

const moreItems = [
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/invoice", label: "Invoice", icon: FileBadge2 },
  { href: "/debts", label: "Debt", icon: HandCoins },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/subscriptions", label: "Subscriptions", icon: Repeat2 },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
  { href: "/settings", label: "Settings", icon: Settings }
] as const;

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-1.5 text-[10px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
          active ? "bg-primary/10 text-primary" : "text-current"
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function MobileBottomNav({ categories }: { categories: CategoryOption[] }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const moreActive = moreItems.some((item) => pathname.startsWith(item.href));

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY < 24) {
        setHidden(false);
      } else if (delta > 8) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <TransactionFormDialog open={transactionOpen} onOpenChange={setTransactionOpen} categories={categories} />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-2 transition-transform duration-300 md:hidden",
          hidden ? "translate-y-[140%]" : "translate-y-0"
        )}
      >
        <div className="relative mx-auto max-w-md">
          <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-[26%] rounded-full bg-background p-0.5">
            <Button
              type="button"
              size="icon"
              onClick={() => setTransactionOpen(true)}
              className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-[0_18px_40px_-14px_hsl(var(--primary)/0.9)] hover:bg-primary/90"
              aria-label="Add transaction"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          <div className="grid h-[80px] grid-cols-5 items-center gap-1 rounded-[2rem] border border-border/80 bg-background/92 px-2 pb-2.5 pt-1.5 shadow-[0_16px_40px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            {leadingItems.map((item) => (
              <MobileNavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname.startsWith(item.href)}
              />
            ))}
            <div aria-hidden="true" />
            {trailingItems.map((item) =>
              item.label === "More" ? (
                <Sheet key={item.href} open={moreOpen} onOpenChange={setMoreOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn(
                        "flex h-full flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-1.5 text-[10px] font-medium",
                        moreActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
                          moreActive ? "bg-primary/10 text-primary" : "text-current"
                        )}
                      >
                        <Ellipsis className="h-5 w-5" />
                      </span>
                      <span>More</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto w-full max-w-none">
                    <SheetHeader>
                      <SheetTitle>More menu</SheetTitle>
                    </SheetHeader>
                    <div className="grid grid-cols-3 gap-3 px-5 py-4 pb-6">
                      {moreItems.map((moreItem) => (
                        <MobileNavLink
                          key={moreItem.href}
                          href={moreItem.href}
                          label={moreItem.label}
                          icon={moreItem.icon}
                          active={pathname.startsWith(moreItem.href)}
                          onClick={() => setMoreOpen(false)}
                        />
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              ) : (
                <MobileNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname.startsWith(item.href)}
                />
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
