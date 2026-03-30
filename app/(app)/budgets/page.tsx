import { BudgetsClient } from "@/features/budgets/components/budgets-client";
import { getBudgetUsage } from "@/services/budget-service";
import { getCategories } from "@/services/category-service";
import { normalizeMonthKey } from "@/utils/date";

export default async function BudgetsPage({
  searchParams
}: {
  searchParams?: { month?: string };
}) {
  const month = normalizeMonthKey(searchParams?.month);
  const [items, categories] = await Promise.all([getBudgetUsage(month), getCategories()]);
  return <BudgetsClient initialItems={items} categories={categories} month={month} />;
}
