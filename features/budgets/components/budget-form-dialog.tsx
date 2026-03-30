"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryQuickCreateDialog } from "@/features/categories/components/category-quick-create-dialog";
import { createBudget } from "@/features/budgets/server/actions";
import { budgetSchema, type BudgetInput } from "@/features/budgets/schemas/budget-schema";
import type { BudgetUsageItem, CategoryOption } from "@/types/app";

export function BudgetFormDialog({
  open,
  onOpenChange,
  categories,
  existingItems,
  month,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  existingItems: BudgetUsageItem[];
  month: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [localCategories, setLocalCategories] = useState(categories);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const router = useRouter();
  const availableCategories = useMemo(
    () =>
      localCategories.filter(
        (category) => category.type === "expense" && !existingItems.some((item) => item.categoryId === category.id)
      ),
    [existingItems, localCategories]
  );
  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: availableCategories[0]?.id ?? "",
      month,
      amount: 0
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: availableCategories[0]?.id ?? "",
        month,
        amount: 0
      });
    }
  }, [open, form, availableCategories, month]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await createBudget(values);
        toast.success("Budget created");
        onOpenChange(false);
        onSuccess();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create budget");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create monthly budget</DialogTitle>
          <DialogDescription>Set a spending limit for a category this month.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label>Expense category</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCategoryDialogOpen(true)}>
                Add category
              </Button>
            </div>
            <Select value={form.watch("categoryId")} onValueChange={(value) => form.setValue("categoryId", value)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!availableCategories.length ? (
              <p className="text-xs text-muted-foreground">All expense categories already have a budget for this month.</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Input {...form.register("month")} placeholder="2026-03" />
          </div>
          <div className="space-y-1.5">
            <Label>Budget amount</Label>
            <AmountInput value={form.watch("amount")} onValueChange={(value) => form.setValue("amount", value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !availableCategories.length}>
              {isPending ? "Saving..." : "Save budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <CategoryQuickCreateDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        type="expense"
        onCreated={(category) => {
          setLocalCategories((current) => [category, ...current.filter((item) => item.id !== category.id)]);
          form.setValue("categoryId", category.id, { shouldDirty: true, shouldValidate: true });
        }}
      />
    </Dialog>
  );
}
