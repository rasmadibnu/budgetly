import { getCategories } from "@/services/category-service";
import { getTransactions } from "@/services/transaction-service";
import { getHouseholdUsers } from "@/services/user-service";
import { TransactionsClient } from "@/features/transactions/components/transactions-client";
import { normalizeMonthKey } from "@/utils/date";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; from?: string; to?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const month = normalizeMonthKey(resolvedSearchParams?.month);
  const from = resolvedSearchParams?.from;
  const to = resolvedSearchParams?.to;
  const [{ rows, summary }, categories, users] = await Promise.all([
    getTransactions({ month, from, to }),
    getCategories(),
    getHouseholdUsers()
  ]);

  return (
    <TransactionsClient
      initialRows={rows}
      summary={summary}
      categories={categories.map((category) => ({ id: category.id, name: category.name, type: category.type, color: category.color }))}
      users={users}
      initialMonth={month}
      initialFrom={from ?? null}
      initialTo={to ?? null}
    />
  );
}
