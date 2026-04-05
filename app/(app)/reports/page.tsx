import { ReportsView } from "@/features/reports/components/reports-view";
import { getDailyCashCalendar, getMonthlyReport } from "@/services/report-service";
import { normalizeMonthKey } from "@/utils/date";

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const month = normalizeMonthKey(resolvedSearchParams?.month);
  const [report, dailyCashCalendar] = await Promise.all([getMonthlyReport(month), getDailyCashCalendar(month)]);

  return <ReportsView initialReport={report} dailyCashCalendar={dailyCashCalendar} month={month} />;
}
