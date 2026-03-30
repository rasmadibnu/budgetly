"use client";

import { useBudgetlyStore } from "@/lib/store";
import { formatCurrency } from "@/utils/format";

export function MoneyValue({ value, className }: { value: number; className?: string }) {
  const amountsVisible = useBudgetlyStore((state) => state.amountsVisible);

  return <span className={className}>{amountsVisible ? formatCurrency(value) : "Rp ••••••"}</span>;
}
