import { getCategories } from "@/services/category-service";
import { getTransactions } from "@/services/transaction-service";
import { getHouseholdUsers } from "@/services/user-service";
import { TransactionsClient } from "@/features/transactions/components/transactions-client";
import { normalizeMonthKey } from "@/utils/date";

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const month = normalizeMonthKey(resolvedSearchParams?.month);
  const [{ rows, summary }, categories, users] = await Promise.all([
    getTransactions({ month }),
    getCategories(),
    getHouseholdUsers()
  ]);

  return (
    <TransactionsClient
      initialRows={rows}
      summary={summary}
      categories={categories}
      users={users}
      initialMonth={month}
    />
  );
}
