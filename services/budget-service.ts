import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { getCurrentMonthKey } from "@/utils/date";

export async function getBudgetUsage(month = getCurrentMonthKey()) {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();

  const [{ data: budgets, error }, { data: categories }] = await Promise.all([
    supabase.from("budget_usage").select("*").eq("household_id", householdId).eq("month", month).order("usage_percentage", { ascending: false }),
    supabase.from("transaction_categories").select("id, name").eq("household_id", householdId)
  ]);

  if (error) throw error;

  const categoriesById = new Map((categories ?? []).map((item) => [item.id, item.name]));

  return (budgets ?? []).map((budget) => ({
    id: budget.budget_id,
    categoryId: budget.category_id,
    category: categoriesById.get(budget.category_id) ?? "Uncategorized",
    month: budget.month,
    amount: budget.budget_amount,
    spent: budget.spent_amount,
    remaining: budget.remaining_amount,
    percentage: budget.usage_percentage
  }));
}
