"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";

const FALLBACK_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899"
];

export function CategoryPieChart({ data }: { data: Array<{ name: string; value: number; color?: string }> }) {
  return (
    <ChartShell title="Sub category distribution" description="See spending grouped by Primary, Secondary, and Tersier.">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={110} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={entry.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
