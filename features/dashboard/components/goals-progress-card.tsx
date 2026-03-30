import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GoalCardData } from "@/types/app";
import { formatCurrency } from "@/utils/format";

export function GoalsProgressCard({ goals }: { goals: GoalCardData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Goals progress</CardTitle>
        <CardDescription>Monitor the current momentum of household savings goals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="space-y-2 rounded-2xl bg-muted/35 p-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{goal.name}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(goal.remaining)} left</p>
            </div>
            <Progress value={goal.progress} />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(goal.currentAmount)}</span>
              <span>{formatCurrency(goal.targetAmount)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
