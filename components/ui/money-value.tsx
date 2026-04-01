"use client";

import { useBudgetlyStore } from "@/lib/store";
import { formatCurrency, formatMobileCurrency } from "@/utils/format";

export function MoneyValue({ value, className, compact = false }: { value: number; className?: string; compact?: boolean }) {
  const amountsVisible = useBudgetlyStore((state) => state.amountsVisible);

  return <span className={className}>{amountsVisible ? (compact ? formatMobileCurrency(value) : formatCurrency(value)) : "Rp ••••••"}</span>;
}
