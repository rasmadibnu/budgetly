import { getCurrentMonthKey } from "@/utils/date";
import type { DashboardSnapshot } from "@/types/app";
import type { CategoryReportGroup } from "@/types/database";
import { getHouseholdContext } from "@/services/household-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdUsers } from "@/services/user-service";

const CATEGORY_REPORT_GROUP_LABELS: Record<CategoryReportGroup, string> = {
  primary: "Primary",
  secondary: "Secondary",
  tersier: "Tersier",
};
const CATEGORY_REPORT_GROUP_ORDER: CategoryReportGroup[] = [
  "primary",
  "secondary",
  "tersier",
];

function formatUsername(value: string) {
  return value.replace(/\b\w/g, (char: string) => char.toUpperCase());
}

function formatMonthLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    month: "short",
    year: "2-digit",
  }).format(new Date(`${value}-01T00:00:00+07:00`));
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatWeekdayLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00+07:00`));
}

export async function getDashboardSnapshot(
  month = getCurrentMonthKey(),
  reportGroup?: CategoryReportGroup,
): Promise<DashboardSnapshot> {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();

  const [
    transactionsResponse,
    categoriesResponse,
    goalsResponse,
    budgetsResponse,
    usersResponse,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, user_id, type, amount, description, date, created_at, payment_method, attachment_url, category_id",
      )
      .eq("household_id", householdId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("transaction_categories")
      .select("id, name, report_group")
      .eq("household_id", householdId),
    supabase
      .from("goals")
      .select("*")
      .eq("household_id", householdId)
      .order("target_date", { ascending: true }),
    supabase
      .from("budget_usage")
      .select("*")
      .eq("household_id", householdId)
      .eq("month", month),
    getHouseholdUsers(),
  ]);

  if (transactionsResponse.error) throw transactionsResponse.error;
  if (categoriesResponse.error) throw categoriesResponse.error;
  if (goalsResponse.error) throw goalsResponse.error;
  if (budgetsResponse.error) throw budgetsResponse.error;
  const categoriesById = new Map(
    categoriesResponse.data.map((category) => [category.id, category]),
  );
  const usersById = new Map(
    usersResponse.map((profile) => [
      profile.id,
      formatUsername(profile.username),
    ]),
  );
  const getTransactionReportGroup = (categoryId: string | null) =>
    (categoriesById.get(categoryId ?? "")?.report_group ??
      "secondary") as CategoryReportGroup;
  const matchesReportGroup = (categoryId: string | null) =>
    !reportGroup || getTransactionReportGroup(categoryId) === reportGroup;

  const currentMonthTransactions = transactionsResponse.data.filter(
    (transaction) => transaction.date.startsWith(month),
  );
  const monthlyIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpense = currentMonthTransactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        matchesReportGroup(transaction.category_id),
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalBalance = transactionsResponse.data.reduce(
    (sum, transaction) =>
      sum +
      (transaction.type === "income"
        ? transaction.amount
        : -transaction.amount),
    0,
  );

  const activeGoals = goalsResponse.data
    .filter((goal) => goal.status !== "cancelled")
    .map((goal) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount,
      progress: goal.target_amount
        ? (goal.current_amount / goal.target_amount) * 100
        : 0,
      remaining: Math.max(0, goal.target_amount - goal.current_amount),
      startDate: goal.start_date,
      targetDate: goal.target_date,
      updatedAt: goal.updated_at,
      status: goal.status,
    }));

  const savingsProgress = activeGoals.length
    ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) /
      activeGoals.length
    : 0;

  const expenseSeriesMonthlyMap = new Map<string, number>();
  const expenseSeriesDailyMap = new Map<string, number>();
  const incomeExpenseMonthlyMap = new Map<
    string,
    { income: number; expense: number }
  >();
  const incomeExpenseDailyMap = new Map<
    string,
    { income: number; expense: number }
  >();
  const categoryDistributionMap = new Map<string, number>();

  transactionsResponse.data.forEach((transaction) => {
    const monthKey = transaction.date.slice(0, 7);
    const monthlyExpenseValue = expenseSeriesMonthlyMap.get(monthKey) ?? 0;
    const monthlyIncomeExpense = incomeExpenseMonthlyMap.get(monthKey) ?? {
      income: 0,
      expense: 0,
    };
    const dailyIncomeExpense = incomeExpenseDailyMap.get(transaction.date) ?? {
      income: 0,
      expense: 0,
    };
    const dailyExpenseValue = expenseSeriesDailyMap.get(transaction.date) ?? 0;

    if (transaction.type === "expense") {
      if (!matchesReportGroup(transaction.category_id)) return;

      expenseSeriesMonthlyMap.set(
        monthKey,
        monthlyExpenseValue + transaction.amount,
      );
      monthlyIncomeExpense.expense += transaction.amount;
      const categoryGroup = getTransactionReportGroup(transaction.category_id);
      const groupName = CATEGORY_REPORT_GROUP_LABELS[categoryGroup];
      categoryDistributionMap.set(
        groupName,
        (categoryDistributionMap.get(groupName) ?? 0) + transaction.amount,
      );

      if (transaction.date.startsWith(month)) {
        expenseSeriesDailyMap.set(
          transaction.date,
          dailyExpenseValue + transaction.amount,
        );
        dailyIncomeExpense.expense += transaction.amount;
      }
    } else {
      monthlyIncomeExpense.income += transaction.amount;

      if (transaction.date.startsWith(month)) {
        dailyIncomeExpense.income += transaction.amount;
      }
    }

    incomeExpenseMonthlyMap.set(monthKey, monthlyIncomeExpense);

    if (transaction.date.startsWith(month)) {
      incomeExpenseDailyMap.set(transaction.date, dailyIncomeExpense);
    }
  });

  const filteredBudgets = budgetsResponse.data.filter((budget) =>
    matchesReportGroup(budget.category_id),
  );
  const budgetRemaining = filteredBudgets.reduce(
    (sum, budget) => sum + budget.remaining_amount,
    0,
  );
  const budgetHighlights = filteredBudgets
    .map((budget) => ({
      id: budget.budget_id,
      categoryId: budget.category_id,
      category: categoriesById.get(budget.category_id)?.name ?? "Uncategorized",
      month: budget.month,
      amount: budget.budget_amount,
      spent: budget.spent_amount,
      remaining: budget.remaining_amount,
      percentage: Number(budget.usage_percentage),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 4);

  const [year, monthNumber] = month.split("-").map(Number);
  const totalDaysInMonth = new Date(year, monthNumber, 0).getDate();
  const dailyCashCalendar = Array.from(
    { length: totalDaysInMonth },
    (_, index) => {
      const date = `${month}-${String(index + 1).padStart(2, "0")}`;
      const values = incomeExpenseDailyMap.get(date) ?? {
        income: 0,
        expense: 0,
      };

      return {
        date,
        dayLabel: formatDayLabel(date),
        weekdayLabel: formatWeekdayLabel(date),
        income: values.income,
        expense: values.expense,
        net: values.income - values.expense,
      };
    },
  );

  return {
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    budgetRemaining,
    savingsProgress,
    recentTransactions: transactionsResponse.data
      .filter(
        (transaction) =>
          !reportGroup ||
          (transaction.type === "expense" &&
            matchesReportGroup(transaction.category_id)),
      )
      .slice(0, 5)
      .map((transaction) => ({
        id: transaction.id,
        userName: usersById.get(transaction.user_id) ?? "Member",
        type: transaction.type,
        amount: transaction.amount,
        categoryId: transaction.category_id,
        category:
          categoriesById.get(transaction.category_id ?? "")?.name ??
          "Uncategorized",
        description: transaction.description,
        date: transaction.date,
        createdAt: transaction.created_at,
        paymentMethod: transaction.payment_method,
        attachmentUrl: transaction.attachment_url,
      })),
    expenseSeriesDaily: dailyCashCalendar.map((entry) => ({
      label: entry.dayLabel,
      amount: entry.expense,
    })),
    expenseSeriesMonthly: Array.from(expenseSeriesMonthlyMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([monthKey, amount]) => ({
        label: formatMonthLabel(monthKey),
        amount,
      })),
    incomeExpenseSeriesDaily: dailyCashCalendar.map((entry) => ({
      label: entry.dayLabel,
      income: entry.income,
      expense: entry.expense,
    })),
    incomeExpenseSeriesMonthly: Array.from(incomeExpenseMonthlyMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([monthKey, values]) => ({
        label: formatMonthLabel(monthKey),
        income: values.income,
        expense: values.expense,
      })),
    dailyCashCalendar,
    categoryDistribution: CATEGORY_REPORT_GROUP_ORDER.map((group) => {
      const name = CATEGORY_REPORT_GROUP_LABELS[group];
      return { name, value: categoryDistributionMap.get(name) ?? 0 };
    }).filter((item) => item.value > 0),
    budgetHighlights,
    activeGoals: activeGoals.slice(0, 4),
  };
}
