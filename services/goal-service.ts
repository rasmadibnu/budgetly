import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

export async function getGoals() {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("goals").select("*").eq("household_id", householdId).order("target_date");

  if (error) throw error;

  return data.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: goal.target_amount,
    currentAmount: goal.current_amount,
    progress: goal.target_amount ? (goal.current_amount / goal.target_amount) * 100 : 0,
    remaining: Math.max(0, goal.target_amount - goal.current_amount),
    targetDate: goal.target_date,
    status: goal.status
  }));
}
