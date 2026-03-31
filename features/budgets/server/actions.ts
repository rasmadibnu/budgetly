"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { budgetSchema, type BudgetInput } from "@/features/budgets/schemas/budget-schema";
import type { BudgetUsageItem } from "@/types/app";

function revalidateBudgets() {
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
}

export async function createBudget(input: BudgetInput): Promise<BudgetUsageItem> {
  const parsed = budgetSchema.parse(input);
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      household_id: householdId,
      category_id: parsed.categoryId,
      month: parsed.month,
      amount: parsed.amount
    })
    .select("id, category_id, month, amount")
    .single();

  if (error) throw error;
  revalidateBudgets();

  return {
    id: data.id,
    categoryId: data.category_id,
    category: "Uncategorized",
    month: data.month,
    amount: data.amount,
    spent: 0,
    remaining: data.amount,
    percentage: 0
  };
}

export async function updateBudget(input: BudgetInput) {
  const parsed = budgetSchema.extend({ id: z.string().uuid() }).parse(input);
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
