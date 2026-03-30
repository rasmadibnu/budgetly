"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";

export function ExpenseChart({ data }: { data: Array<{ month: string; amount: number }> }) {
  return (
    <ChartShell title="Monthly expenses" description="Track expense movement month by month.">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} />
            <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
            <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
