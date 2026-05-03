"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";
import { Button } from "@/components/ui/button";
import { MoneyValue } from "@/components/ui/money-value";
import { useMobile } from "@/hooks/use-mobile";
import type { MonthlyCategoryReportRow } from "@/types/app";

function formatReportValue(value: number) {
  return value > 0 ? formatCompactCurrency(value) : "";
}

function MonthlyCategoryReportTable({ rows }: { rows: MonthlyCategoryReportRow[] }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-xs">
        <thead>
          <tr className="bg-muted/25">
            <th className="border border-border px-3 py-2 text-left font-semibold" rowSpan={2}>Month</th>
            <th className="border border-border px-3 py-2 text-right font-semibold" rowSpan={2}>Income</th>
            <th className="border border-border px-3 py-2 text-center font-semibold" colSpan={4}>Expense</th>
          </tr>
          <tr className="bg-muted/25">
            <th className="border border-border px-3 py-2 text-right font-medium">Primary</th>
            <th className="border border-border px-3 py-2 text-right font-medium">Secondary</th>
            <th className="border border-border px-3 py-2 text-right font-medium">Tersier</th>
            <th className="border border-border px-3 py-2 text-right font-medium">Sum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <td className="border border-border px-3 py-2 font-medium">{row.month}</td>
              <td className="border border-border px-3 py-2 text-right">{formatReportValue(row.income)}</td>
              <td className="border border-border px-3 py-2 text-right">{formatReportValue(row.primary)}</td>
              <td className="border border-border px-3 py-2 text-right">{formatReportValue(row.secondary)}</td>
              <td className="border border-border px-3 py-2 text-right">{formatReportValue(row.tersier)}</td>
              <td className="border border-border px-3 py-2 text-right font-medium">{formatReportValue(row.sum)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExpenseChart({
  dailyData,
  monthlyData,
  monthlyReport
}: {
  dailyData: Array<{ label: string; amount: number; dateKey?: string }>;
  monthlyData: Array<{ label: string; amount: number }>;
  monthlyReport: MonthlyCategoryReportRow[];
}) {
  const [view, setView] = useState<"daily" | "monthly">("daily");
  const router = useRouter();
  const isMobile = useMobile();
  const data = view === "daily" ? dailyData : monthlyData;
  const clickableDailyData = useMemo(
    () => dailyData.map((item) => ({ ...item, clickable: Boolean(item.dateKey && item.amount > 0) })),
    [dailyData]
  );
  const chartData = view === "daily" ? clickableDailyData : monthlyData;
  const totalExpense = data.reduce((sum, item) => sum + item.amount, 0);
  const peakDay = data.reduce((best, item) => (item.amount > best.amount ? item : best), data[0] ?? { label: "-", amount: 0 });
  const mobileChartWidth = Math.max(chartData.length * 72, 420);

  const handleBarClick = (payload?: { activePayload?: Array<{ payload?: { dateKey?: string; amount?: number } }> }) => {
    if (view !== "daily") return;
    const item = payload?.activePayload?.[0]?.payload;
    if (!item?.dateKey || !item.amount) return;
    router.push(`/transactions?from=${item.dateKey}&to=${item.dateKey}`);
  };

  return (
    <ChartShell title={view === "daily" ? "Daily expenses" : "Monthly expenses"} description={view === "daily" ? "Track expense movement day by day this month." : "Track expense movement month by month."}>
      <MonthlyCategoryReportTable rows={monthlyReport} />
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
      <div className="h-80 min-w-0">
        {isMobile ? (
          <div className="h-full overflow-x-auto overflow-y-hidden">
            <BarChart width={mobileChartWidth} height={320} data={chartData} margin={{ top: 36, right: 12, left: 12, bottom: 8 }} onClick={handleBarClick}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} interval={0} tick={{ fontSize: 11 }} />
              <YAxis hide axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} />
              <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
              <Bar dataKey="amount" fill="hsl(var(--danger))" radius={[12, 12, 0, 0]} cursor={view === "daily" ? "pointer" : "default"}>
                {chartData.map((entry, index) => (
                  <Cell key={`mobile-expense-${entry.label}-${index}`} fill={entry.amount > 0 ? "hsl(var(--danger))" : "hsl(var(--danger) / 0.25)"} />
                ))}
                {view === "daily" ? (
                  <LabelList dataKey="amount" position="top" offset={8} formatter={(value: number) => formatCompactCurrency(value)} className="fill-foreground text-[11px] font-semibold" />
                ) : null}
              </Bar>
            </BarChart>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} onClick={handleBarClick}>
              <XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={view === "daily" ? 18 : 12} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} />
              <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
              <Bar dataKey="amount" fill="hsl(var(--danger))" radius={[12, 12, 0, 0]} cursor={view === "daily" ? "pointer" : "default"}>
                {chartData.map((entry, index) => (
                  <Cell key={`desktop-expense-${entry.label}-${index}`} fill={entry.amount > 0 ? "hsl(var(--danger))" : "hsl(var(--danger) / 0.25)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartShell>
  );
}
