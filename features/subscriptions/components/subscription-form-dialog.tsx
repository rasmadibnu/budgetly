"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createSubscription, updateSubscription } from "@/features/subscriptions/server/actions";
import { subscriptionSchema, type SubscriptionInput } from "@/features/subscriptions/schemas/subscription-schema";
import type { CategoryOption } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const defaults: SubscriptionInput = {
  name: "",
  vendor: "",
  amount: 0,
  billingDay: 1,
  categoryId: "",
  paymentMethod: "",
  startDate: new Date().toISOString().slice(0, 10),
  status: "active",
  notes: ""
};

export function SubscriptionFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData,
  categories
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: SubscriptionInput;
  categories: CategoryOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<SubscriptionInput>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (open) form.reset(initialData ?? defaults);
  }, [form, initialData, open]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (values.id) {
          await updateSubscription(values);
        } else {
          await createSubscription(values);
        }
        toast.success(values.id ? "Subscription updated" : "Subscription added");
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save subscription");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit subscription" : "Add subscription"}</DialogTitle>
          <DialogDescription>Recurring monthly expense that generates a payable cycle for each selected month.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <input type="hidden" {...form.register("id")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Netflix Family" />
            </div>
            <div className="space-y-1.5">
              <Label>Vendor</Label>
              <Input {...form.register("vendor")} placeholder="Netflix" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input type="number" {...form.register("amount")} />
            </div>
            <div className="space-y-1.5">
              <Label>Billing day</Label>
              <Input type="number" min={1} max={28} {...form.register("billingDay")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Expense category</Label>
              <Select value={form.watch("categoryId") || "__none"} onValueChange={(value) => form.setValue("categoryId", value === "__none" ? "" : value)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Input {...form.register("paymentMethod")} placeholder="Credit Card or Debit Card" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" {...form.register("startDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as SubscriptionInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Plan tier, family usage, or renewal note" />
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
