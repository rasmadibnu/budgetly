"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { goalSchema, type GoalInput } from "@/features/goals/schemas/goal-schema";

function revalidateGoals() {
  revalidatePath("/dashboard");
  revalidatePath("/goals");
}

export async function createGoal(input: GoalInput) {
  const parsed = goalSchema.parse(input);
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("goals").insert({
    household_id: householdId,
    name: parsed.name,
    target_amount: parsed.targetAmount,
    current_amount: parsed.currentAmount,
    start_date: parsed.startDate,
    target_date: parsed.targetDate ?? null,
    status: parsed.status
  });

  if (error) throw error;
  revalidateGoals();
}

export async function updateGoal(input: GoalInput) {
  const parsed = goalSchema.extend({ id: goalSchema.shape.id.unwrap() }).parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("goals")
    .update({
      name: parsed.name,
      target_amount: parsed.targetAmount,
      current_amount: parsed.currentAmount,
      start_date: parsed.startDate,
      target_date: parsed.targetDate ?? null,
      status: parsed.status
    })
    .eq("id", parsed.id);

  if (error) throw error;
  revalidateGoals();
}

export async function updateGoalProgress(id: string, currentAmount: number) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("goals").update({ current_amount: currentAmount }).eq("id", id);
  if (error) throw error;
  revalidateGoals();
}

export async function completeGoal(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("goals").update({ status: "completed" }).eq("id", id);
  if (error) throw error;
  revalidateGoals();
}
