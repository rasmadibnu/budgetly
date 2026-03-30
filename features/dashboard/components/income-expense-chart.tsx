"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";

export function IncomeExpenseChart({
  data
}: {
  data: Array<{ month: string; income: number; expense: number }>;
}) {
  return (
    <ChartShell title="Income vs expense" description="Compare cash-in and cash-out trends.">
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
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
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
