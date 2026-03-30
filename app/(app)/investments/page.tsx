import { InvestmentsClient } from "@/features/investments/components/investments-client";
import { getInvestments } from "@/services/investment-service";

export default async function InvestmentsPage() {
  const items = await getInvestments();
  return <InvestmentsClient initialItems={items} />;
}
