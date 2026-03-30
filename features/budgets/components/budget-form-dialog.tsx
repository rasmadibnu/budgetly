"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createBudget } from "@/features/budgets/server/actions";
import { budgetSchema, type BudgetInput } from "@/features/budgets/schemas/budget-schema";
import type { CategoryOption } from "@/types/app";

export function BudgetFormDialog({
  open,
  onOpenChange,
  categories,
  month,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  month: string;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: categories.find((c) => c.type === "expense")?.id ?? "",
      month,
      amount: 0
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: categories.find((c) => c.type === "expense")?.id ?? "",
        month,
        amount: 0
      });
    }
  }, [open, form, categories, month]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await createBudget(values);
        toast.success("Budget created");
        onOpenChange(false);
        onSuccess();
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
            <Label>Expense category</Label>
            <Select value={form.watch("categoryId")} onValueChange={(value) => form.setValue("categoryId", value)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.filter((c) => c.type === "expense").map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Input {...form.register("month")} placeholder="2026-03" />
          </div>
          <div className="space-y-1.5">
            <Label>Budget amount</Label>
            <Input type="number" {...form.register("amount")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
