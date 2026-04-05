"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoneyValue } from "@/components/ui/money-value";
import type { DailyCashCalendarEntry } from "@/types/app";
import { cn } from "@/utils/cn";
import { formatMonthLabel } from "@/utils/format";

function getLeadingEmptyDays(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  return (firstDay + 6) % 7;
}

const weekdayHeaders = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function DailyCashCalendar({
  month,
  entries
}: {
  month: string;
  entries: DailyCashCalendarEntry[];
}) {
  const [selectedDate, setSelectedDate] = useState(entries.find((entry) => entry.income > 0 || entry.expense > 0)?.date ?? entries[0]?.date);

  useEffect(() => {
    setSelectedDate(entries.find((entry) => entry.income > 0 || entry.expense > 0)?.date ?? entries[0]?.date);
  }, [entries]);

  const selectedEntry = entries.find((entry) => entry.date === selectedDate) ?? entries[0];
  const activeDays = entries.filter((entry) => entry.income > 0 || entry.expense > 0).length;
  const bestNetDay = [...entries].sort((left, right) => right.net - left.net)[0];
  const heaviestExpenseDay = [...entries].sort((left, right) => right.expense - left.expense)[0];
  const leadingEmptyDays = getLeadingEmptyDays(month);
  const monthCells: Array<DailyCashCalendarEntry | null> = [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...entries
  ];

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Daily cash calendar</CardTitle>
            <CardDescription>
              Review income, expense, and net movement day by day for {formatMonthLabel(`${month}-01`)}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{activeDays} active days</Badge>
            <Badge variant="outline">
              Best net {bestNetDay ? <MoneyValue value={bestNetDay.net} compact /> : "Rp 0"}
            </Badge>
            <Badge variant="outline">
              Peak spend {heaviestExpenseDay ? <MoneyValue value={heaviestExpenseDay.expense} compact /> : "Rp 0"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">
        <div className="overflow-hidden rounded-3xl border border-border bg-muted/15">
          <div className="grid grid-cols-7 border-b border-border bg-muted/35">
            {weekdayHeaders.map((label) => (
              <div key={label} className="px-2 py-3 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((entry, index) => {
              if (!entry) {
                return <div key={`empty-${index}`} className="min-h-24 border-b border-r border-border/70 bg-background/30 sm:min-h-32" />;
              }

              const isSelected = selectedEntry?.date === entry.date;
              const hasActivity = entry.income > 0 || entry.expense > 0;
              const isPositive = entry.net >= 0;

              return (
                <button
                  key={entry.date}
                  type="button"
                  onClick={() => setSelectedDate(entry.date)}
                  className={cn(
                    "flex min-h-24 flex-col items-start gap-2 border-b border-r border-border/70 p-2 text-left transition hover:bg-background/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-32 sm:p-3",
                    isSelected && "bg-primary/8",
                    hasActivity && !isSelected && "bg-background/60"
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold", isSelected ? "bg-primary text-primary-foreground" : "bg-background text-foreground")}>
                      {entry.dayLabel}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      {entry.weekdayLabel}
                    </span>
                  </div>

                  <div className="hidden w-full space-y-1.5 sm:block">
                    <div className="flex items-center justify-between rounded-xl bg-success/10 px-2 py-1 text-[11px]">
                      <span className="text-success">In</span>
                      <MoneyValue value={entry.income} compact className="font-medium text-success" />
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-danger/10 px-2 py-1 text-[11px]">
                      <span className="text-danger">Out</span>
                      <MoneyValue value={entry.expense} compact className="font-medium text-danger" />
                    </div>
                    <div className={cn("rounded-xl px-2 py-1 text-[11px] font-medium", isPositive ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning")}>
                      Net <MoneyValue value={entry.net} compact className="font-medium" />
                    </div>
                  </div>

                  <div className="sm:hidden">
                    {hasActivity ? (
                      <div className={cn("rounded-full px-2 py-1 text-[10px] font-medium", isPositive ? "bg-primary/10 text-primary" : "bg-warning/15 text-warning")}>
                        <MoneyValue value={entry.net} compact />
                      </div>
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-border" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">
                {selectedEntry ? `${selectedEntry.weekdayLabel}, ${selectedEntry.dayLabel}` : "No day selected"}
              </CardTitle>
              <CardDescription>
                {selectedEntry ? new Date(`${selectedEntry.date}T00:00:00+07:00`).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                }) : "Select a day to inspect its cash summary."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <div className="rounded-2xl bg-success/10 p-4">
                <p className="text-sm text-success">Income</p>
                <p className="mt-1 text-lg font-semibold"><MoneyValue value={selectedEntry?.income ?? 0} /></p>
              </div>
              <div className="rounded-2xl bg-danger/10 p-4">
                <p className="text-sm text-danger">Expense</p>
                <p className="mt-1 text-lg font-semibold"><MoneyValue value={selectedEntry?.expense ?? 0} /></p>
              </div>
              <div className={cn("rounded-2xl p-4", (selectedEntry?.net ?? 0) >= 0 ? "bg-primary/10" : "bg-warning/15")}>
                <p className={cn("text-sm", (selectedEntry?.net ?? 0) >= 0 ? "text-primary" : "text-warning")}>Net</p>
                <p className="mt-1 text-lg font-semibold"><MoneyValue value={selectedEntry?.net ?? 0} /></p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">How to read it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl bg-muted/40 p-3">
                Green income chips show money coming in on that date.
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                Red expense chips show money going out.
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                On mobile, tap any day to see the full amount breakdown below the calendar.
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
