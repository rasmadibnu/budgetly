"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";

export function IncomeExpenseChart({
  dailyData,
  monthlyData
}: {
  dailyData: Array<{ label: string; income: number; expense: number }>;
  monthlyData: Array<{ label: string; income: number; expense: number }>;
}) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const data = view === "daily" ? dailyData : monthlyData;

  return (
    <ChartShell title={view === "daily" ? "Income vs expense by day" : "Income vs expense"} description={view === "daily" ? "Compare daily cash-in and cash-out for this month." : "Compare cash-in and cash-out trends."}>
      <div className="mb-4 flex gap-2">
        <Button type="button" size="sm" variant={view === "daily" ? "default" : "outline"} onClick={() => setView("daily")}>Daily</Button>
        <Button type="button" size="sm" variant={view === "monthly" ? "default" : "outline"} onClick={() => setView("monthly")}>Monthly</Button>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.45} />
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.45} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={view === "daily" ? 18 : 12} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} />
            <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
            <Area type="monotone" dataKey="income" stroke="hsl(var(--chart-3))" fill="url(#incomeGradient)" />
            <Area type="monotone" dataKey="expense" stroke="hsl(var(--chart-2))" fill="url(#expenseGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
