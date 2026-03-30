"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { budgetSchema, type BudgetInput } from "@/features/budgets/schemas/budget-schema";

function revalidateBudgets() {
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

export async function createBudget(input: BudgetInput) {
  const parsed = budgetSchema.parse(input);
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("budgets").insert({
    household_id: householdId,
    category_id: parsed.categoryId,
    month: parsed.month,
    amount: parsed.amount
  });

  if (error) throw error;
  revalidateBudgets();
}

export async function updateBudget(input: BudgetInput) {
  const parsed = budgetSchema.extend({ id: budgetSchema.shape.id.unwrap() }).parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("budgets")
    .update({
      category_id: parsed.categoryId,
      month: parsed.month,
      amount: parsed.amount
    })
    .eq("id", parsed.id);

  if (error) throw error;
  revalidateBudgets();
}

export async function deleteBudget(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw error;
  revalidateBudgets();
}
