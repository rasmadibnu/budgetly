import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getDashboardSnapshot } from "@/services/dashboard-service";
import { normalizeMonthKey } from "@/utils/date";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const month = normalizeMonthKey(resolvedSearchParams?.month);
  const snapshot = await getDashboardSnapshot(month);
  return <DashboardView snapshot={snapshot} />;
}
