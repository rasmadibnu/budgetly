"use client";

import { useState } from "react";
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { MoneyValue } from "@/components/ui/money-value";
import { useMobile } from "@/hooks/use-mobile";

export function ExpenseChart({
  dailyData,
  monthlyData
}: {
  dailyData: Array<{ label: string; amount: number }>;
  monthlyData: Array<{ label: string; amount: number }>;
}) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const isMobile = useMobile();
  const data = view === "daily" ? dailyData : monthlyData;
  const totalExpense = data.reduce((sum, item) => sum + item.amount, 0);
  const peakDay = data.reduce((best, item) => (item.amount > best.amount ? item : best), data[0] ?? { label: "-", amount: 0 });
  const showInlineLabels = isMobile && data.length <= 8;

  return (
    <ChartShell title={view === "daily" ? "Daily expenses" : "Monthly expenses"} description={view === "daily" ? "Track expense movement day by day this month." : "Track expense movement month by month."}>
      <div className="mb-4 flex gap-2">
        <Button type="button" size="sm" variant={view === "daily" ? "default" : "outline"} onClick={() => setView("daily")}>Daily</Button>
        <Button type="button" size="sm" variant={view === "monthly" ? "default" : "outline"} onClick={() => setView("monthly")}>Monthly</Button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden">
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total</p>
          <p className="mt-1 text-sm font-semibold"><MoneyValue value={totalExpense} compact /></p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Peak</p>
          <p className="mt-1 text-sm font-semibold">{peakDay.label} · <MoneyValue value={peakDay.amount} compact /></p>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={view === "daily" ? 18 : 12} />
            <YAxis hide={isMobile} axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} />
            <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
            <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[12, 12, 0, 0]}>
              {showInlineLabels ? (
                <LabelList dataKey="amount" position="top" formatter={(value: number) => formatCompactCurrency(value)} className="fill-foreground text-[10px] font-medium" />
              ) : null}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
