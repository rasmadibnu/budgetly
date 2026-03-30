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
import { createGoal } from "@/features/goals/server/actions";
import { goalSchema, type GoalInput } from "@/features/goals/schemas/goal-schema";

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
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (open) {
      form.reset({ ...defaults, startDate: new Date().toISOString().slice(0, 10) });
    }
  }, [open, form]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await createGoal(values);
        toast.success("Goal created");
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create goal");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a new goal</DialogTitle>
          <DialogDescription>Create a focused savings target with a deadline.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
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
              {isPending ? "Saving..." : "Create goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
