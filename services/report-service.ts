import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { getCurrentMonthKey } from "@/utils/date";
import { getTransactions } from "@/services/transaction-service";
import { getBudgetUsage } from "@/services/budget-service";
import { getGoals } from "@/services/goal-service";
import { getDebtsReceivables } from "@/services/debt-service";
import { getInvestments } from "@/services/investment-service";
import { getSubscriptions } from "@/services/subscription-service";
import type { DailyCashCalendarEntry, MonthlyReportRecord } from "@/types/app";

interface AiMonthlyNarrative {
  overview: string;
  insights: string[];
  risks: string[];
  actions: string[];
  generatedAt: string;
}

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit"
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatWeekdayLabel(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short"
  }).format(new Date(`${value}T00:00:00+07:00`));
}

async function generateAiNarrative(summary: {
  month: string;
  income: number;
  expense: number;
  net: number;
  budgets: unknown[];
  goals: unknown[];
  debts: unknown[];
  investments: unknown[];
  subscriptions: unknown[];
}): Promise<AiMonthlyNarrative | undefined> {
  if (!env.AI_API_KEY) {
    return undefined;
  }

  const prompt = `
You are a finance analyst for a small family budget app.
Create a monthly report in JSON only.
Return this exact shape:
{
  "overview": "string",
  "insights": ["string"],
  "risks": ["string"],
  "actions": ["string"]
}

Rules:
- Keep language concise and practical.
- Use Indonesian household finance context and IDR.
- Mention budget overruns, savings progress, and cash flow quality when relevant.
- Consider debt exposure, receivable collection, investment performance, and unpaid subscriptions when relevant.
- insights, risks, and actions should each contain 3 items if possible.

Monthly data:
${JSON.stringify(summary)}
`.trim();

  const response = await fetch(`${env.AI_API_BASE_URL.replace(/\/$/, "")}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.AI_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      max_tokens: 1024,
      temperature: 0.4,
      system: "You generate structured monthly finance reports and must return valid JSON only.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`AI report request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const content = data.content?.find((item) => item.type === "text")?.text;
  if (!content) {
    throw new Error("AI report response was empty.");
  }

  const parsed = JSON.parse(content) as Omit<AiMonthlyNarrative, "generatedAt">;
  return {
    overview: parsed.overview,
    insights: parsed.insights ?? [],
    risks: parsed.risks ?? [],
    actions: parsed.actions ?? [],
    generatedAt: new Date().toISOString()
  };
}

export async function generateMonthlyReport(month = getCurrentMonthKey()) {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const [transactions, budgets, goals, debts, investments, subscriptions] = await Promise.all([
    getTransactions({ month }),
    getBudgetUsage(month),
    getGoals(),
    getDebtsReceivables(),
    getInvestments(),
    getSubscriptions(month)
  ]);

  const summary = {
    month,
    income: transactions.summary.income,
    expense: transactions.summary.expense,
    net: transactions.summary.net,
    budgets,
    goals,
    debts,
    investments,
    subscriptions
  };
  const aiReport = await generateAiNarrative(summary);
  const summaryPayload = {
    ...summary,
    aiReport
  };

  const { error } = await supabase.from("monthly_reports").upsert(
    {
      household_id: householdId,
      month,
      summary_json: summaryPayload
    },
    {
      onConflict: "household_id,month"
    }
  );

  if (error) throw error;

  return summaryPayload;
}

export async function getMonthlyReports(): Promise<MonthlyReportRecord[]> {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("monthly_reports")
    .select("id, month, summary_json, created_at")
    .eq("household_id", householdId)
    .order("month", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((report) => ({
    id: report.id,
    month: report.month,
    createdAt: report.created_at,
    summary: report.summary_json as MonthlyReportRecord["summary"]
  }));
}

export async function getMonthlyReport(month = getCurrentMonthKey()): Promise<MonthlyReportRecord | null> {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("monthly_reports")
    .select("id, month, summary_json, created_at")
    .eq("household_id", householdId)
    .eq("month", month)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    month: data.month,
    createdAt: data.created_at,
    summary: data.summary_json as MonthlyReportRecord["summary"]
  };
}

export async function getDailyCashCalendar(month = getCurrentMonthKey()): Promise<DailyCashCalendarEntry[]> {
  const { rows } = await getTransactions({ month });
  const dailyTotals = new Map<string, { income: number; expense: number }>();

  rows.forEach((transaction) => {
    const current = dailyTotals.get(transaction.date) ?? { income: 0, expense: 0 };

    if (transaction.type === "income") {
      current.income += transaction.amount;
    } else {
      current.expense += transaction.amount;
    }

    dailyTotals.set(transaction.date, current);
  });

  const [year, monthNumber] = month.split("-").map(Number);
  const totalDaysInMonth = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: totalDaysInMonth }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    const values = dailyTotals.get(date) ?? { income: 0, expense: 0 };

    return {
      date,
      dayLabel: formatDayLabel(date),
      weekdayLabel: formatWeekdayLabel(date),
      income: values.income,
      expense: values.expense,
      net: values.income - values.expense
    };
  });
}

export async function backupHousehold() {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();

  const [categories, transactions, goals, budgets, invoices, debts, investments, subscriptions, subscriptionCycles] = await Promise.all([
    supabase.from("transaction_categories").select("*").eq("household_id", householdId),
    supabase.from("transactions").select("*").eq("household_id", householdId),
    supabase.from("goals").select("*").eq("household_id", householdId),
    supabase.from("budgets").select("*").eq("household_id", householdId),
    supabase.from("invoices").select("*").eq("household_id", householdId),
    supabase.from("debts_receivables").select("*").eq("household_id", householdId),
    supabase.from("investments").select("*").eq("household_id", householdId),
    supabase.from("subscriptions").select("*").eq("household_id", householdId),
    supabase.from("subscription_cycles").select("*").eq("household_id", householdId)
  ]);

  return {
    householdId,
    exportedAt: new Date().toISOString(),
    categories: categories.data ?? [],
    transactions: transactions.data ?? [],
    goals: goals.data ?? [],
    budgets: budgets.data ?? [],
    invoices: invoices.data ?? [],
    debts: debts.data ?? [],
    investments: investments.data ?? [],
    subscriptions: subscriptions.data ?? [],
    subscriptionCycles: subscriptionCycles.data ?? []
  };
}
