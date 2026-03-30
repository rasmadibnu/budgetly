import { BudgetsClient } from "@/features/budgets/components/budgets-client";
import { getBudgetUsage } from "@/services/budget-service";
import { getCategories } from "@/services/category-service";
import { normalizeMonthKey } from "@/utils/date";

export default async function BudgetsPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const month = normalizeMonthKey(resolvedSearchParams?.month);
  const [items, categories] = await Promise.all([getBudgetUsage(month), getCategories()]);
  return <BudgetsClient initialItems={items} categories={categories} month={month} />;
}
