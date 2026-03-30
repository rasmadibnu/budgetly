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
import { Textarea } from "@/components/ui/textarea";
import { transactionSchema, type TransactionInput } from "@/features/transactions/schemas/transaction-schema";
import { createTransaction, updateTransaction } from "@/features/transactions/server/actions";
import type { CategoryOption, TransactionListItem, UserProfile } from "@/types/app";

const defaultValues: TransactionInput = {
  type: "expense",
  amount: 0,
  categoryId: null,
  description: "",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "Bank Transfer",
  attachmentUrl: null,
  isRecurring: false,
  recurrenceRule: null
};

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryOption[];
  users?: UserProfile[];
  initialData?: TransactionListItem & { categoryId?: string | null };
}) {
  const [isPending, startTransition] = useTransition();
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
            <Input id="amount" type="number" {...form.register("amount")} />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={form.watch("categoryId") ?? undefined}
              onValueChange={(value) => form.setValue("categoryId", value === "none" ? null : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorized</SelectItem>
                {categories
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
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...form.register("date")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment method</Label>
            <Input id="paymentMethod" {...form.register("paymentMethod")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attachmentUrl">Attachment URL</Label>
            <Input id="attachmentUrl" placeholder="https://..." {...form.register("attachmentUrl")} />
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
    </Dialog>
  );
}
