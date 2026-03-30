"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createInvestment, updateInvestment } from "@/features/investments/server/actions";
import { investmentSchema, type InvestmentInput } from "@/features/investments/schemas/investment-schema";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const investmentTypeOptions = [
  { value: "Stocks", label: "📈 Stocks" },
  { value: "Mutual Funds", label: "📊 Mutual Funds" },
  { value: "Gold", label: "🥇 Gold" },
  { value: "Crypto", label: "₿ Crypto" },
  { value: "Time Deposit", label: "🏦 Time Deposit" },
  { value: "Property", label: "🏠 Property" },
  { value: "Business", label: "💼 Business" },
  { value: "Other", label: "✨ Other" }
] as const;

const defaults: InvestmentInput = {
  name: "",
  platform: "",
  type: "Stocks",
  amount: 0,
  currentValue: 0,
  startedAt: new Date().toISOString().slice(0, 10),
  status: "active",
  notes: ""
};

export function InvestmentFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: InvestmentInput;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<InvestmentInput>({
    resolver: zodResolver(investmentSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (open) form.reset(initialData ?? defaults);
  }, [form, initialData, open]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (values.id) {
          await updateInvestment(values);
        } else {
          await createInvestment(values);
        }
        toast.success(values.id ? "Investment updated" : "Investment added");
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save investment");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit investment" : "Add investment"}</DialogTitle>
          <DialogDescription>Track capital placed into deposits, stocks, crypto, or other assets.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <input type="hidden" {...form.register("id")} />
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...form.register("name")} placeholder="IDX value stocks" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Input {...form.register("platform")} placeholder="Bibit, Ajaib, bank, or broker" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investment type" />
                </SelectTrigger>
                <SelectContent>
                  {investmentTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Initial amount</Label>
              <AmountInput value={form.watch("amount")} onValueChange={(value) => form.setValue("amount", value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Current value</Label>
              <AmountInput value={form.watch("currentValue")} onValueChange={(value) => form.setValue("currentValue", value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <DatePickerField value={form.watch("startedAt")} onChange={(value) => form.setValue("startedAt", value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as InvestmentInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Risk level, target horizon, or investment thesis" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
