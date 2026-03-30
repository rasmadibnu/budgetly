"use client";

import { useEffect, useState, useTransition } from "react";
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
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CategoryQuickCreateDialog } from "@/features/categories/components/category-quick-create-dialog";
import { transactionSchema, type TransactionInput } from "@/features/transactions/schemas/transaction-schema";
import { createTransaction, updateTransaction } from "@/features/transactions/server/actions";
import type { CategoryOption, TransactionListItem, UserProfile } from "@/types/app";

const defaultValues: TransactionInput = {
  type: "expense",
  amount: 0,
  categoryId: null,
  description: "",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: null,
  attachmentUrl: null,
  isRecurring: false,
  recurrenceRule: null
};

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  initialData,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  users?: UserProfile[];
  initialData?: TransactionListItem & { categoryId?: string | null };
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [localCategories, setLocalCategories] = useState(categories);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const router = useRouter();
  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData
      ? {
          id: initialData.id,
          type: initialData.type,
          amount: initialData.amount,
          categoryId: initialData.categoryId ?? null,
          description: initialData.description,
          date: initialData.date,
          paymentMethod: initialData.paymentMethod,
          attachmentUrl: initialData.attachmentUrl,
          isRecurring: false,
          recurrenceRule: null
        }
      : defaultValues
  });

  useEffect(() => {
    form.reset(
      initialData
        ? {
            id: initialData.id,
            type: initialData.type,
            amount: initialData.amount,
            categoryId: initialData.categoryId ?? null,
            description: initialData.description,
            date: initialData.date,
            paymentMethod: initialData.paymentMethod,
            attachmentUrl: initialData.attachmentUrl,
            isRecurring: false,
            recurrenceRule: null
          }
        : defaultValues
    );
  }, [form, initialData, open]);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const selectedType = form.watch("type");

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (values.id) {
          await updateTransaction(values);
        } else {
          await createTransaction(values);
        }
        toast.success(values.id ? "Transaction updated" : "Transaction created");
        onOpenChange(false);
        onSuccess?.();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save transaction.");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>Record income or expense with household-level visibility.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={selectedType} onValueChange={(value) => form.setValue("type", value as "income" | "expense")}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <AmountInput id="amount" value={form.watch("amount")} onValueChange={(value) => form.setValue("amount", value)} />
          </div>
          <div className="space-y-2">
            <div className="flex min-h-8 items-center justify-between gap-2">
              <Label>Category</Label>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCategoryDialogOpen(true)}>
                Add category
              </Button>
            </div>
            <Select
              value={form.watch("categoryId") ?? undefined}
              onValueChange={(value) => form.setValue("categoryId", value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {localCategories
                  .filter((category) => category.type === selectedType)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex min-h-8 items-center">
              <Label htmlFor="date">Date</Label>
            </div>
            <DatePickerField id="date" value={form.watch("date")} onChange={(value) => form.setValue("date", value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>
          <DialogFooter className="md:col-span-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : initialData ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <CategoryQuickCreateDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        type={selectedType}
        onCreated={(category) => {
          setLocalCategories((current) => [category, ...current.filter((item) => item.id !== category.id)]);
          form.setValue("categoryId", category.id, { shouldDirty: true, shouldValidate: true });
        }}
      />
    </Dialog>
  );
}
