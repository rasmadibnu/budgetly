import { DebtsClient } from "@/features/debts/components/debts-client";
import { getDebtsReceivables } from "@/services/debt-service";

export default async function DebtsPage() {
  const items = await getDebtsReceivables();
  return <DebtsClient initialItems={items} />;
}
