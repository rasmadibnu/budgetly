"use client";

import { useEffect, useState, useTransition } from "react";
import { Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { MoneyValue } from "@/components/ui/money-value";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/feedback/empty-state";
import { BudgetFormDialog } from "@/features/budgets/components/budget-form-dialog";
import { deleteBudget } from "@/features/budgets/server/actions";
import type { BudgetInput } from "@/features/budgets/schemas/budget-schema";
import type { BudgetUsageItem, CategoryOption } from "@/types/app";
import { formatPercentage } from "@/utils/format";

function getBudgetTone(percentage: number) {
  if (percentage > 90) return "text-danger";
  if (percentage >= 70) return "text-foreground";
  return "text-success";
}

export function BudgetsClient({ initialItems, categories, month }: { initialItems: BudgetUsageItem[]; categories: CategoryOption[]; month: string }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<(BudgetInput & { id: string }) | undefined>(undefined);
  const [items, setItems] = useState(initialItems);
  const [deletingBudget, setDeletingBudget] = useState<BudgetUsageItem | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<BudgetUsageItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

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
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Budgets"
        title="🧾 Category-based monthly limits"
        description="Set category guardrails and see the percentage used update automatically from transactions."
        actions={
          <Button className="shrink-0 md:h-9 md:px-4 md:py-2" size="icon" onClick={() => {
            setEditingBudget(undefined);
            setDialogOpen(true);
          }} aria-label="Add budget" title="Add budget">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="sr-only md:not-sr-only">Add budget</span>
          </Button>
        }
      />
      <BudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        existingItems={items}
        month={month}
        initialData={editingBudget}
        onSuccess={(item, mode) => {
          setItems((current) =>
            mode === "create"
              ? [item, ...current]
              : current.map((entry) => entry.id === item.id ? { ...entry, ...item } : entry)
          );
          setEditingBudget(undefined);
          router.refresh();
        }}
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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{item.category}</h3>
                    <p className="text-[12px] text-muted-foreground">{item.month}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <p className={`text-lg font-semibold ${getBudgetTone(item.percentage)}`}>{formatPercentage(item.percentage)}</p>
                    <div className="hidden items-center gap-2 sm:flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        onClick={() => {
                          setEditingBudget({
                            id: item.id,
                            categoryId: item.categoryId,
                            month: item.month,
                            amount: item.amount
                          });
                          setDialogOpen(true);
                        }}
                        aria-label={`Edit ${item.category} budget`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" disabled={isPending} onClick={() => setDeletingBudget(item)} aria-label={`Delete ${item.category} budget`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Progress value={item.percentage} className={item.percentage > 90 ? "[&>div]:bg-danger" : item.percentage >= 70 ? "[&>div]:bg-warning" : "[&>div]:bg-success"} />
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-muted-foreground">Budget</p><MoneyValue value={item.amount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Spent</p><MoneyValue value={item.spent} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Remaining</p><MoneyValue value={item.remaining} className="font-semibold" /></div>
                </div>
                <div className="flex items-center justify-end border-t border-border/70 pt-3 sm:hidden">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedBudget(item)} aria-label={`Open actions for ${item.category} budget`}>
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <Sheet open={Boolean(selectedBudget)} onOpenChange={(open) => !open && setSelectedBudget(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Budget actions</SheetTitle>
            <SheetDescription>
              {selectedBudget ? `${selectedBudget.category} · ${selectedBudget.month}` : "Choose what to do with this budget."}
            </SheetDescription>
          </SheetHeader>
          {selectedBudget ? (
            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">{selectedBudget.category}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedBudget.month}</p>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Budget</span><MoneyValue value={selectedBudget.amount} className="font-semibold" /></div>
                  <div className="flex items-center justify-between"><span className="text-muted-foreground">Spent</span><MoneyValue value={selectedBudget.spent} className="font-semibold" /></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="justify-center"
                  onClick={() => {
                    setEditingBudget({
                      id: selectedBudget.id,
                      categoryId: selectedBudget.categoryId,
                      month: selectedBudget.month,
                      amount: selectedBudget.amount
                    });
                    setSelectedBudget(null);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="justify-center"
                  disabled={isPending}
                  onClick={() => {
                    setDeletingBudget(selectedBudget);
                    setSelectedBudget(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
