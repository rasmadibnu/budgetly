import { SubscriptionsClient } from "@/features/subscriptions/components/subscriptions-client";
import { getCategories } from "@/services/category-service";
import { getSubscriptions } from "@/services/subscription-service";
import { normalizeMonthKey } from "@/utils/date";

export default async function SubscriptionsPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const month = normalizeMonthKey(resolvedSearchParams?.month);
  const [items, categories] = await Promise.all([getSubscriptions(month), getCategories()]);

  return (
    <SubscriptionsClient
      initialItems={items}
      categories={categories.filter((category) => category.type === "expense")}
      month={month}
    />
  );
}
