import { ReportsView } from "@/features/reports/components/reports-view";
import { getMonthlyReport } from "@/services/report-service";
import { normalizeMonthKey } from "@/utils/date";

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: { month?: string };
}) {
  const month = normalizeMonthKey(searchParams?.month);
  const report = await getMonthlyReport(month);
  return <ReportsView initialReport={report} month={month} />;
}
