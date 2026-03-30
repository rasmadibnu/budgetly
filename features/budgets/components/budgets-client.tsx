"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { MoneyValue } from "@/components/ui/money-value";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/feedback/empty-state";
import { BudgetFormDialog } from "@/features/budgets/components/budget-form-dialog";
import { deleteBudget } from "@/features/budgets/server/actions";
import type { BudgetUsageItem, CategoryOption } from "@/types/app";
import { formatPercentage } from "@/utils/format";

function getBudgetTone(percentage: number) {
  if (percentage > 90) return "text-danger";
  if (percentage >= 70) return "text-foreground";
  return "text-success";
}

export function BudgetsClient({ initialItems, categories, month }: { initialItems: BudgetUsageItem[]; categories: CategoryOption[]; month: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [deletingBudget, setDeletingBudget] = useState<BudgetUsageItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onDelete = (id: string) => {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    startTransition(async () => {
      try {
        await deleteBudget(id);
        toast.success("Budget deleted");
        router.refresh();
      } catch (error) {
        setItems(previous);
        toast.error(error instanceof Error ? error.message : "Unable to delete budget");
      }
    });
  };

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
        existingItems={items}
        month={month}
        onSuccess={() => router.refresh()}
      />
      <ConfirmDialog
        open={Boolean(deletingBudget)}
        onOpenChange={(open) => !open && setDeletingBudget(null)}
        title="Delete budget?"
        description={deletingBudget ? `This will permanently remove the ${deletingBudget.category} budget for ${deletingBudget.month}.` : "This budget will be removed permanently."}
        isPending={isPending}
        onConfirm={() => deletingBudget && onDelete(deletingBudget.id)}
      />
      <div className="space-y-4">
        {!items.length ? (
          <EmptyState title="No budgets yet" description="Start with the most important spending categories for this month." />
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{item.category}</h3>
                    <p className="text-[12px] text-muted-foreground">{item.month}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-lg font-semibold ${getBudgetTone(item.percentage)}`}>{formatPercentage(item.percentage)}</p>
                    <Button variant="ghost" size="icon" disabled={isPending} onClick={() => setDeletingBudget(item)} aria-label={`Delete ${item.category} budget`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
