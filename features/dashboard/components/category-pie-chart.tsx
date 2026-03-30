"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { ChartShell } from "@/components/charts/chart-shell";
import { formatCompactCurrency } from "@/utils/format";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))"
];

export function CategoryPieChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ChartShell title="Category distribution" description="See where household spending concentrates.">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={110} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCompactCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartShell>
  );
}
