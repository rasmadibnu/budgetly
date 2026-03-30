"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { categorySchema, type CategoryInput } from "@/features/categories/schemas/category-schema";

export async function upsertCategory(input: CategoryInput) {
  const parsed = categorySchema.parse(input);
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("transaction_categories").upsert({
    id: parsed.id,
    household_id: householdId,
    name: parsed.name,
    type: parsed.type,
    color: parsed.color,
    icon: parsed.icon ?? null
  });

  if (error) throw error;
  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
}

export async function deleteCategory(id: string) {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const [{ count: transactionCount, error: transactionError }, { count: budgetCount, error: budgetError }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("category_id", id),
    supabase
      .from("budgets")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("category_id", id)
  ]);

  if (transactionError) throw transactionError;
  if (budgetError) throw budgetError;
  if ((transactionCount ?? 0) > 0 || (budgetCount ?? 0) > 0) {
    throw new Error("This category is already used by transactions or budgets and cannot be deleted.");
  }

  const { error } = await supabase.from("transaction_categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
}
