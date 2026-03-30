"use client";

import { useState, useTransition } from "react";
import { Bot, CalendarDays, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MonthlyReportRecord } from "@/types/app";
import { formatCurrency, formatMonthLabel } from "@/utils/format";
import { generateMonthlyReportAction } from "@/features/settings/server/actions";

export function ReportsView({ initialReport, month }: { initialReport: MonthlyReportRecord | null; month: string }) {
  const [report, setReport] = useState(initialReport);
  const [isPending, startTransition] = useTransition();

  const generateCurrentMonth = () => {
    startTransition(async () => {
      try {
        const created = await generateMonthlyReportAction(month);
        const nextReport: MonthlyReportRecord = {
          id: `generated-${created.month}`,
          month: created.month,
          createdAt: new Date().toISOString(),
          summary: created
        };
        setReport(nextReport);
        toast.success("Monthly AI report generated");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to generate report");
      }
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="AI monthly finance reports"
        description={`Generate and review monthly household report narratives for ${formatMonthLabel(`${month}-01`)}.`}
        actions={
          <Button onClick={generateCurrentMonth} disabled={isPending}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isPending ? "Generating..." : "Generate selected month"}
          </Button>
        }
      />

      {report ? (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary"><Wallet className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Income</p>
                    <p className="text-xl font-semibold">{formatCurrency(report.summary.income)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="rounded-xl bg-warning/15 p-2 text-warning"><TrendingDown className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expense</p>
                    <p className="text-xl font-semibold">{formatCurrency(report.summary.expense)}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-5">
                  <div className="rounded-xl bg-success/15 p-2 text-success"><TrendingUp className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net</p>
                    <p className="text-xl font-semibold">{formatCurrency(report.summary.net)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{formatMonthLabel(`${report.month}-01`)}</CardTitle>
                    <CardDescription>Stored monthly analysis for the household.</CardDescription>
                  </div>
                  <Badge variant="outline">
                    <CalendarDays className="mr-2 h-3.5 w-3.5" />
                    {new Date(report.createdAt).toLocaleDateString("id-ID")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-2xl border border-border bg-muted/25 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <p className="font-medium">AI overview</p>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {report.summary.aiReport?.overview ?? "No AI narrative is stored for this month yet. Generate the report again after configuring the AI API key."}
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Insights</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      {(report.summary.aiReport?.insights ?? []).map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl bg-muted/35 p-3">{item}</div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Risks</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      {(report.summary.aiReport?.risks ?? []).map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl bg-muted/35 p-3">{item}</div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      {(report.summary.aiReport?.actions ?? []).map((item, index) => (
                        <div key={`${item}-${index}`} className="rounded-xl bg-muted/35 p-3">{item}</div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No report exists for {formatMonthLabel(`${month}-01`)} yet. Generate the selected month from the top navbar.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
