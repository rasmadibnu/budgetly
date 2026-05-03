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
import type { MonthlyReportRecord } from "@/types/app";

interface AiMonthlyNarrative {
  overview: string;
  insights: string[];
  risks: string[];
  actions: string[];
  generatedAt: string;
}

function extractJsonObject(value: string) {
  const withoutFence = value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI report response did not contain JSON.");
  }

  return withoutFence.slice(start, end + 1);
}

function extractTextFromJsonResponse(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;

  const response = data as {
    overview?: string;
    content?: Array<{ type?: string; text?: string }>;
    choices?: Array<{ message?: { content?: string }; delta?: { content?: string } }>;
    text?: string;
  };

  if (typeof response.overview === "string") return JSON.stringify(response);
  if (typeof response.text === "string") return response.text;

  const anthropicText = response.content?.find((item) => item.type === "text" && typeof item.text === "string")?.text;
  if (anthropicText) return anthropicText;

  return response.choices
    ?.map((choice) => choice.message?.content ?? choice.delta?.content ?? "")
    .join("")
    .trim();
}

function extractTextFromSseResponse(value: string) {
  let content = "";

  for (const line of value.split(/\r?\n/)) {
    if (!line.startsWith("data:")) continue;

    const payload = line.slice("data:".length).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      const event = JSON.parse(payload) as {
        type?: string;
        delta?: { type?: string; text?: string; content?: string };
        content_block?: { type?: string; text?: string };
        choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
      };

      if (event.delta?.type === "text_delta" && typeof event.delta.text === "string") {
        content += event.delta.text;
      } else if (typeof event.delta?.content === "string") {
        content += event.delta.content;
      } else if (event.content_block?.type === "text" && typeof event.content_block.text === "string") {
        content += event.content_block.text;
      } else if (event.choices?.length) {
        content += event.choices.map((choice) => choice.delta?.content ?? choice.message?.content ?? "").join("");
      }
    } catch {
      content += payload;
    }
  }

  return content.trim() || undefined;
}

function parseAiResponseBody(body: string): Omit<AiMonthlyNarrative, "generatedAt"> {
  const trimmed = body.trim();
  let content: string | undefined;

  if (trimmed.startsWith("event:") || trimmed.startsWith("data:")) {
    content = extractTextFromSseResponse(trimmed);
  } else {
    const parsed = JSON.parse(trimmed);
    content = extractTextFromJsonResponse(parsed);
  }

  if (!content) {
    throw new Error("AI report response was empty.");
  }

  if (content.trim().startsWith("event:") || content.trim().startsWith("data:")) {
    content = extractTextFromSseResponse(content);
  }

  if (!content) {
    throw new Error("AI report response was empty.");
  }

  return JSON.parse(extractJsonObject(content)) as Omit<AiMonthlyNarrative, "generatedAt">;
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
      stream: false,
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

  const parsed = parseAiResponseBody(await response.text());
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
