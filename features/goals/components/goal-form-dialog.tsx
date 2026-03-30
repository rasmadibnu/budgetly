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
              <Input type="number" {...form.register("targetAmount")} />
            </div>
            <div className="space-y-1.5">
              <Label>Current amount</Label>
              <Input type="number" {...form.register("currentAmount")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" {...form.register("startDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <Input type="date" {...form.register("targetDate")} />
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
