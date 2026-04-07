"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { MoneyValue } from "@/components/ui/money-value";
import { useMobile } from "@/hooks/use-mobile";

export function IncomeExpenseChart({
  dailyData,
  monthlyData
}: {
  dailyData: Array<{ label: string; income: number; expense: number }>;
  monthlyData: Array<{ label: string; income: number; expense: number }>;
}) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const isMobile = useMobile();
  const data = view === "daily" ? dailyData : monthlyData;
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
  const mobileChartWidth = Math.max(data.length * 84, 480);

  return (
    <ChartShell title={view === "daily" ? "Income vs expense by day" : "Income vs expense"} description={view === "daily" ? "Compare daily cash-in and cash-out for this month." : "Compare cash-in and cash-out trends."}>
      <div className="mb-4 flex gap-2">
        <Button type="button" size="sm" variant={view === "daily" ? "default" : "outline"} onClick={() => setView("daily")}>Daily</Button>
        <Button type="button" size="sm" variant={view === "monthly" ? "default" : "outline"} onClick={() => setView("monthly")}>Monthly</Button>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2 lg:hidden">
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Income</p>
          <p className="mt-1 text-sm font-semibold text-[hsl(var(--chart-3))]"><MoneyValue value={totalIncome} compact /></p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Expense</p>
          <p className="mt-1 text-sm font-semibold text-danger"><MoneyValue value={totalExpense} compact /></p>
        </div>
        <div className="rounded-2xl bg-muted/40 p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Net</p>
          <p className="mt-1 text-sm font-semibold"><MoneyValue value={totalIncome - totalExpense} compact /></p>
        </div>
      </div>
      <div className="h-80 min-w-0">
        {isMobile ? (
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <AreaChart width={mobileChartWidth} height={320} data={data} margin={{ top: 44, right: 12, left: 12, bottom: 12 }}>
              <defs>
                <linearGradient id="incomeGradientMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradientMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--danger))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--danger))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11 }} />
              <YAxis hide axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} />
              <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
              <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-3))" fill="url(#incomeGradientMobile)">
                {view === "daily" ? (
                  <LabelList dataKey="income" position="top" offset={18} formatter={(value: number) => formatCompactCurrency(value)} className="fill-[hsl(var(--chart-3))] text-[11px] font-semibold" />
                ) : null}
              </Area>
              <Area type="monotone" dataKey="expense" stroke="hsl(var(--danger))" fill="url(#expenseGradientMobile)">
                {view === "daily" ? (
                  <LabelList dataKey="expense" position="top" offset={2} formatter={(value: number) => formatCompactCurrency(value)} className="fill-[hsl(var(--danger))] text-[11px] font-semibold" />
                ) : null}
              </Area>
            </AreaChart>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--danger))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--danger))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={view === "daily" ? 18 : 12} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} />
              <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
              <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-3))" fill="url(#incomeGradient)" />
              <Area type="monotone" dataKey="expense" stroke="hsl(var(--danger))" fill="url(#expenseGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartShell>
  );
}
