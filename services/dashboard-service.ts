import { getCurrentMonthKey } from "@/utils/date";
import type { DashboardSnapshot } from "@/types/app";
import { getHouseholdContext } from "@/services/household-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdUsers } from "@/services/user-service";

function formatUsername(value: string) {
  return value.replace(/\b\w/g, (char: string) => char.toUpperCase());
}

export async function getDashboardSnapshot(month = getCurrentMonthKey()): Promise<DashboardSnapshot> {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();

  const [
    transactionsResponse,
    categoriesResponse,
    goalsResponse,
    budgetsResponse,
    usersResponse
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, user_id, type, amount, description, date, created_at, payment_method, attachment_url, category_id")
      .eq("household_id", householdId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("transaction_categories").select("id, name").eq("household_id", householdId),
    supabase.from("goals").select("*").eq("household_id", householdId).order("target_date", { ascending: true }),
    supabase.from("budget_usage").select("*").eq("household_id", householdId).eq("month", month),
    getHouseholdUsers()
  ]);

  if (transactionsResponse.error) throw transactionsResponse.error;
  if (categoriesResponse.error) throw categoriesResponse.error;
  if (goalsResponse.error) throw goalsResponse.error;
  if (budgetsResponse.error) throw budgetsResponse.error;
  const categoriesById = new Map(categoriesResponse.data.map((category) => [category.id, category.name]));
  const usersById = new Map(
    usersResponse.map((profile) => [profile.id, formatUsername(profile.username)])
  );

  const currentMonthTransactions = transactionsResponse.data.filter((transaction) => transaction.date.startsWith(month));
  const monthlyIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpense = currentMonthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalBalance = transactionsResponse.data.reduce(
    (sum, transaction) => sum + (transaction.type === "income" ? transaction.amount : -transaction.amount),
    0
  );

  const activeGoals = goalsResponse.data
    .filter((goal) => goal.status !== "cancelled")
    .map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      progress: goal.target_amount ? (goal.current_amount / goal.target_amount) * 100 : 0,
      remaining: Math.max(0, goal.target_amount - goal.current_amount),
      startDate: goal.start_date,
      targetDate: goal.target_date,
      updatedAt: goal.updated_at,
      status: goal.status
    }));

  const savingsProgress = activeGoals.length
    ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) / activeGoals.length
    : 0;

  const expenseSeriesMap = new Map<string, number>();
  const incomeExpenseMap = new Map<string, { income: number; expense: number }>();
  const categoryDistributionMap = new Map<string, number>();

  transactionsResponse.data.forEach((transaction) => {
    const monthKey = transaction.date.slice(0, 7);
    const monthValue = expenseSeriesMap.get(monthKey) ?? 0;
    const incomeExpense = incomeExpenseMap.get(monthKey) ?? { income: 0, expense: 0 };

    if (transaction.type === "expense") {
      expenseSeriesMap.set(monthKey, monthValue + transaction.amount);
      incomeExpense.expense += transaction.amount;
      const categoryName = categoriesById.get(transaction.category_id ?? "") ?? "Uncategorized";
      categoryDistributionMap.set(categoryName, (categoryDistributionMap.get(categoryName) ?? 0) + transaction.amount);
    } else {
      incomeExpense.income += transaction.amount;
    }

    incomeExpenseMap.set(monthKey, incomeExpense);
  });

  const budgetRemaining = budgetsResponse.data.reduce((sum, budget) => sum + budget.remaining_amount, 0);
  const budgetHighlights = budgetsResponse.data
    .map((budget) => ({
      id: budget.budget_id,
      categoryId: budget.category_id,
      category: categoriesById.get(budget.category_id) ?? "Uncategorized",
      month: budget.month,
      amount: budget.budget_amount,
      spent: budget.spent_amount,
      remaining: budget.remaining_amount,
      percentage: Number(budget.usage_percentage)
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4);

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    budgetRemaining,
    savingsProgress,
    recentTransactions: transactionsResponse.data.slice(0, 5).map((transaction) => ({
      id: transaction.id,
      userName: usersById.get(transaction.user_id) ?? "Member",
      type: transaction.type,
      amount: transaction.amount,
      categoryId: transaction.category_id,
      category: categoriesById.get(transaction.category_id ?? "") ?? "Uncategorized",
      description: transaction.description,
      date: transaction.date,
      createdAt: transaction.created_at,
      paymentMethod: transaction.payment_method,
      attachmentUrl: transaction.attachment_url
    })),
    expenseSeries: Array.from(expenseSeriesMap.entries()).map(([monthKey, amount]) => ({ month: monthKey, amount })),
    incomeExpenseSeries: Array.from(incomeExpenseMap.entries()).map(([monthKey, values]) => ({
      month: monthKey,
      income: values.income,
      expense: values.expense
    })),
    categoryDistribution: Array.from(categoryDistributionMap.entries()).map(([name, value]) => ({ name, value })),
    budgetHighlights,
    activeGoals: activeGoals.slice(0, 4)
  };
}
