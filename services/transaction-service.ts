import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { getCurrentMonthKey, getMonthDateRange } from "@/utils/date";
import { toCsv } from "@/utils/csv";
import { getHouseholdUsers } from "@/services/user-service";

interface TransactionFilters {
  search?: string;
  type?: string;
  categoryId?: string;
  userId?: string;
  month?: string;
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const month = filters.month ?? getCurrentMonthKey();
  const { start, end } = getMonthDateRange(month);

  let query = supabase
    .from("transactions")
    .select("id, user_id, type, amount, description, date, payment_method, attachment_url, category_id", {
      count: "exact"
    })
    .eq("household_id", householdId)
    .gte("date", start.toISOString().slice(0, 10))
    .lte("date", end.toISOString().slice(0, 10))
    .order("date", { ascending: false });

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
  const usersById = new Map(users.map((item) => [item.id, item.email]));

  const rows = (transactions ?? []).map((transaction) => ({
    id: transaction.id,
    userName: usersById.get(transaction.user_id) ?? "Member",
    type: transaction.type,
    amount: transaction.amount,
    categoryId: transaction.category_id,
    category: categoriesById.get(transaction.category_id ?? "") ?? "Uncategorized",
    description: transaction.description,
    date: transaction.date,
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
