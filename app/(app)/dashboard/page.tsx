import { DashboardView } from "@/features/dashboard/components/dashboard-view";
import { getDashboardSnapshot } from "@/services/dashboard-service";
import type { CategoryReportGroup } from "@/types/database";
import { normalizeMonthKey } from "@/utils/date";

function normalizeReportGroup(value?: string): CategoryReportGroup | undefined {
  if (value === "primary" || value === "secondary" || value === "tersier") {
    return value;
  }

  return undefined;
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; group?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const month = normalizeMonthKey(resolvedSearchParams?.month);
  const reportGroup = normalizeReportGroup(resolvedSearchParams?.group);
  const snapshot = await getDashboardSnapshot(month, reportGroup);
  return <DashboardView snapshot={snapshot} reportGroup={reportGroup} />;
}
