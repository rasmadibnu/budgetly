import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { getCurrentMonthKey } from "@/utils/date";
import { getTransactions } from "@/services/transaction-service";
import { getBudgetUsage } from "@/services/budget-service";
import { getGoals } from "@/services/goal-service";
import type { MonthlyReportRecord } from "@/types/app";

interface AiMonthlyNarrative {
  overview: string;
  insights: string[];
  risks: string[];
  actions: string[];
  generatedAt: string;
}

async function generateAiNarrative(summary: {
  month: string;
  income: number;
  expense: number;
  net: number;
  budgets: unknown[];
  goals: unknown[];
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
  const [transactions, budgets, goals] = await Promise.all([
    getTransactions({ month }),
    getBudgetUsage(month),
    getGoals()
  ]);

  const summary = {
    month,
    income: transactions.summary.income,
    expense: transactions.summary.expense,
    net: transactions.summary.net,
    budgets,
    goals
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

export async function backupHousehold() {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();

  const [categories, transactions, goals, budgets, invoices] = await Promise.all([
    supabase.from("transaction_categories").select("*").eq("household_id", householdId),
    supabase.from("transactions").select("*").eq("household_id", householdId),
    supabase.from("goals").select("*").eq("household_id", householdId),
    supabase.from("budgets").select("*").eq("household_id", householdId),
    supabase.from("invoices").select("*").eq("household_id", householdId)
  ]);

  return {
    householdId,
    exportedAt: new Date().toISOString(),
    categories: categories.data ?? [],
    transactions: transactions.data ?? [],
    goals: goals.data ?? [],
    budgets: budgets.data ?? [],
    invoices: invoices.data ?? []
  };
}
