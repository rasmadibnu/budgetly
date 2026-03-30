"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyValue } from "@/components/ui/money-value";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/feedback/empty-state";
import { BudgetFormDialog } from "@/features/budgets/components/budget-form-dialog";
import type { BudgetUsageItem, CategoryOption } from "@/types/app";
import { formatPercentage } from "@/utils/format";

function getBudgetTone(percentage: number) {
  if (percentage > 90) return "text-danger";
  if (percentage >= 70) return "text-foreground";
  return "text-success";
}

export function BudgetsClient({ initialItems, categories, month }: { initialItems: BudgetUsageItem[]; categories: CategoryOption[]; month: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Budgets"
        title="🧾 Category-based monthly limits"
        description="Set category guardrails and see the percentage used update automatically from transactions."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add budget
          </Button>
        }
      />
      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        month={month}
        onSuccess={() => router.refresh()}
      />
      <div className="space-y-4">
        {!initialItems.length ? (
          <EmptyState title="No budgets yet" description="Start with the most important spending categories for this month." />
        ) : (
          initialItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{item.category}</h3>
                    <p className="text-[12px] text-muted-foreground">{item.month}</p>
                  </div>
                  <p className={`text-lg font-semibold ${getBudgetTone(item.percentage)}`}>{formatPercentage(item.percentage)}</p>
                </div>
                <Progress value={item.percentage} className={item.percentage > 90 ? "[&>div]:bg-danger" : item.percentage >= 70 ? "[&>div]:bg-warning" : "[&>div]:bg-success"} />
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-muted-foreground">Budget</p><MoneyValue value={item.amount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Spent</p><MoneyValue value={item.spent} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Remaining</p><MoneyValue value={item.remaining} className="font-semibold" /></div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
