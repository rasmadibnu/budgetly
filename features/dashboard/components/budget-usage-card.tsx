import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MoneyValue } from "@/components/ui/money-value";
import type { BudgetUsageItem } from "@/types/app";

function getProgressTone(percentage: number) {
  if (percentage > 90) return "[&>div]:bg-danger";
  if (percentage >= 70) return "[&>div]:bg-warning";
  return "[&>div]:bg-success";
}

export function BudgetUsageCard({ budgets }: { budgets: BudgetUsageItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget usage</CardTitle>
        <CardDescription>Categories closest to their monthly limit.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {budgets.length ? budgets.map((budget) => (
          <div key={budget.id} className="space-y-2 rounded-2xl bg-muted/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{budget.category}</p>
              <p className="text-sm font-semibold">{Math.round(budget.percentage)}%</p>
            </div>
            <Progress value={budget.percentage} className={getProgressTone(budget.percentage)} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span><MoneyValue value={budget.spent} /> spent</span>
              <span><MoneyValue value={budget.remaining} /> left</span>
            </div>
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No budgets set for this month yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
