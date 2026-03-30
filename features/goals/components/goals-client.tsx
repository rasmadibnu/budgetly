"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { MoneyValue } from "@/components/ui/money-value";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/feedback/empty-state";
import { GoalFormDialog } from "@/features/goals/components/goal-form-dialog";
import { completeGoal, deleteGoal } from "@/features/goals/server/actions";
import type { GoalCardData } from "@/types/app";
import { formatDate, formatDateTime } from "@/utils/format";

function getGoalCountdown(targetDate: string | null) {
  if (!targetDate) return "Flexible target";

  const today = new Date();
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(targetDate);
  const targetOnly = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.ceil((targetOnly.getTime() - current.getTime()) / 86_400_000);

  if (diffDays > 1) return `${diffDays} days left`;
  if (diffDays === 1) return "1 day left";
  if (diffDays === 0) return "Due today";
  if (diffDays === -1) return "1 day overdue";
  return `${Math.abs(diffDays)} days overdue`;
}

export function GoalsClient({ initialGoals }: { initialGoals: GoalCardData[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GoalCardData | undefined>(undefined);
  const [deletingGoal, setDeletingGoal] = useState<GoalCardData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const markCompleted = (id: string) => {
    startTransition(async () => {
      try {
        await completeGoal(id);
        toast.success("Goal completed");
        router.refresh();
      } catch {
        toast.error("Unable to complete goal");
      }
    });
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteGoal(id);
        toast.success("Goal deleted");
        router.refresh();
      } catch {
        toast.error("Unable to delete goal");
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Goals"
        title="🎯 Savings targets for the family"
        description="Track longer-term priorities like an emergency fund, travel, or big purchases."
        actions={
          <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add goal
          </Button>
        }
      />
      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editing}
        onSuccess={() => router.refresh()}
      />
      <ConfirmDialog
        open={Boolean(deletingGoal)}
        onOpenChange={(open) => !open && setDeletingGoal(null)}
        title="Delete goal?"
        description={deletingGoal ? `This will permanently remove "${deletingGoal.name}".` : "This goal will be removed permanently."}
        isPending={isPending}
        onConfirm={() => deletingGoal && onDelete(deletingGoal.id)}
      />
      <div className="space-y-4">
        {!initialGoals.length ? (
          <EmptyState title="No goals yet" description="Set the first family savings target to make progress visible." />
        ) : (
          initialGoals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{goal.name}</h3>
                    <p className="text-[12px] text-muted-foreground">
                      {getGoalCountdown(goal.targetDate)}
                      {goal.targetDate ? ` · ${formatDate(goal.targetDate)}` : ""}
                    </p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Last updated · {formatDateTime(goal.updatedAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(goal);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant={goal.status === "completed" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => markCompleted(goal.id)}
                      disabled={goal.status === "completed" || isPending}
                    >
                      {goal.status === "completed" ? "Completed" : "Mark completed"}
                    </Button>
                    <Button variant="ghost" size="icon" disabled={isPending} onClick={() => setDeletingGoal(goal)} aria-label={`Delete ${goal.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={goal.progress} />
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-muted-foreground">Current</p><MoneyValue value={goal.currentAmount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Target</p><MoneyValue value={goal.targetAmount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Remaining</p><MoneyValue value={goal.remaining} className="font-semibold" /></div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
