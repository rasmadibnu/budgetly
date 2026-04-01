"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";

export function ExpenseChart({
  dailyData,
  monthlyData
}: {
  dailyData: Array<{ label: string; amount: number }>;
  monthlyData: Array<{ label: string; amount: number }>;
}) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const data = view === "daily" ? dailyData : monthlyData;

  return (
    <ChartShell title={view === "daily" ? "Daily expenses" : "Monthly expenses"} description={view === "daily" ? "Track expense movement day by day this month." : "Track expense movement month by month."}>
      <div className="mb-4 flex gap-2">
        <Button type="button" size="sm" variant={view === "daily" ? "default" : "outline"} onClick={() => setView("daily")}>Daily</Button>
        <Button type="button" size="sm" variant={view === "monthly" ? "default" : "outline"} onClick={() => setView("monthly")}>Monthly</Button>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={view === "daily" ? 18 : 12} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} />
            <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
            <Bar dataKey="amount" fill="hsl(var(--chart-1))" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
