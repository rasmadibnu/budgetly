import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { getCurrentMonthKey, getMonthDateRange } from "@/utils/date";
import { toCsv } from "@/utils/csv";
import { getHouseholdUsers } from "@/services/user-service";

function formatUsername(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function isValidDateInput(value?: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

interface TransactionFilters {
  search?: string;
  type?: string;
  categoryId?: string;
  userId?: string;
  month?: string;
  from?: string;
  to?: string;
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const month = filters.month ?? getCurrentMonthKey();
  const { start, end } = getMonthDateRange(month);
  const startDate = isValidDateInput(filters.from) ? filters.from! : start.toISOString().slice(0, 10);
  const endDate = isValidDateInput(filters.to) ? filters.to! : end.toISOString().slice(0, 10);
  const [rangeStart, rangeEnd] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];

  let query = supabase
    .from("transactions")
    .select("id, user_id, type, amount, description, date, created_at, payment_method, attachment_url, category_id", {
      count: "exact"
    })
    .eq("household_id", householdId)
    .gte("date", rangeStart)
    .lte("date", rangeEnd)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.type) query = query.eq("type", filters.type as "income" | "expense");
  if (filters.categoryId) query = query.eq("category_id", filters.categoryId);
  if (filters.userId) query = query.eq("user_id", filters.userId);
  if (filters.search) query = query.ilike("description", `%${filters.search}%`);

  const [{ data: transactions, error: transactionError }, { data: categories }, users] = await Promise.all([
    query,
    supabase.from("transaction_categories").select("id, name").eq("household_id", householdId),
    getHouseholdUsers()
  ]);

  if (transactionError) throw transactionError;

  const categoriesById = new Map((categories ?? []).map((item) => [item.id, item.name]));
  const usersById = new Map(users.map((item) => [item.id, formatUsername(item.username)]));

  const rows = (transactions ?? []).map((transaction) => ({
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
  }));

  const summary = rows.reduce(
    (accumulator, transaction) => {
      if (transaction.type === "income") accumulator.income += transaction.amount;
      if (transaction.type === "expense") accumulator.expense += transaction.amount;
      return accumulator;
    },
    { income: 0, expense: 0 }
  );

  return {
    rows,
    summary: {
      ...summary,
      net: summary.income - summary.expense
    }
  };
}

export async function exportTransactionsCsv(month?: string) {
  const { rows } = await getTransactions({ month });
  return toCsv(rows);
}
