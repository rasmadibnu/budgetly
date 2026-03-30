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
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGoal, updateGoal } from "@/features/goals/server/actions";
import { goalSchema, type GoalInput } from "@/features/goals/schemas/goal-schema";
import type { GoalCardData } from "@/types/app";

const defaults: GoalInput = {
  name: "",
  currentAmount: 0,
  targetAmount: 0,
  startDate: new Date().toISOString().slice(0, 10),
  targetDate: "",
  status: "active"
};

export function GoalFormDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: GoalCardData;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (open) {
      form.reset(
        initialData
          ? {
              id: initialData.id,
              name: initialData.name,
              targetAmount: initialData.targetAmount,
              currentAmount: initialData.currentAmount,
              startDate: initialData.startDate,
              targetDate: initialData.targetDate ?? "",
              status: initialData.status
            }
          : { ...defaults, startDate: new Date().toISOString().slice(0, 10) }
      );
    }
  }, [open, form, initialData]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (values.id) {
          await updateGoal(values);
        } else {
          await createGoal(values);
        }
        toast.success(values.id ? "Goal updated" : "Goal created");
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save goal");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit goal" : "Add a new goal"}</DialogTitle>
          <DialogDescription>Create a focused savings target with a deadline.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <input type="hidden" {...form.register("id")} />
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...form.register("name")} placeholder="Emergency fund" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Target amount</Label>
              <AmountInput value={form.watch("targetAmount")} onValueChange={(value) => form.setValue("targetAmount", value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Current amount</Label>
              <AmountInput value={form.watch("currentAmount")} onValueChange={(value) => form.setValue("currentAmount", value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <DatePickerField value={form.watch("startDate")} onChange={(value) => form.setValue("startDate", value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <DatePickerField value={form.watch("targetDate") || ""} onChange={(value) => form.setValue("targetDate", value)} placeholder="Optional target date" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : initialData ? "Update goal" : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
