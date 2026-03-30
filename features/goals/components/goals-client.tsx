"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyValue } from "@/components/ui/money-value";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/feedback/empty-state";
import { GoalFormDialog } from "@/features/goals/components/goal-form-dialog";
import { completeGoal } from "@/features/goals/server/actions";
import type { GoalCardData } from "@/types/app";
import { formatDate } from "@/utils/format";

export function GoalsClient({ initialGoals }: { initialGoals: GoalCardData[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Goals"
        title="🎯 Savings targets for the family"
        description="Track longer-term priorities like an emergency fund, travel, or big purchases."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add goal
          </Button>
        }
      />
      <GoalFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => router.refresh()}
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
                    <p className="text-[12px] text-muted-foreground">Target: {goal.targetDate ? formatDate(goal.targetDate) : "Flexible"}</p>
                  </div>
                  <Button
                    variant={goal.status === "completed" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => markCompleted(goal.id)}
                    disabled={goal.status === "completed" || isPending}
                  >
                    {goal.status === "completed" ? "Completed" : "Mark completed"}
                  </Button>
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
