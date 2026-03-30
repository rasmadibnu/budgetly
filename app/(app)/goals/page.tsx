import { GoalsClient } from "@/features/goals/components/goals-client";
import { getGoals } from "@/services/goal-service";

export default async function GoalsPage() {
  const goals = await getGoals();
  return <GoalsClient initialGoals={goals} />;
}
