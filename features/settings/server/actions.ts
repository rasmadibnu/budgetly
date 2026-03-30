"use server";

import { getHouseholdContext } from "@/services/household-service";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { backupHousehold, generateMonthlyReport } from "@/services/report-service";

export async function exportBackupAction() {
  return backupHousehold();
}

export async function generateMonthlyReportAction(month?: string) {
  return generateMonthlyReport(month);
}

export async function restoreHouseholdAction(payload: {
  categories: Record<string, unknown>[];
  transactions: Record<string, unknown>[];
  goals: Record<string, unknown>[];
  budgets: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
}) {
  const { profile, householdId } = await getHouseholdContext();
  if (profile.role !== "owner") {
    throw new Error("Only the owner can restore a backup.");
  }

  const supabase = await createSupabaseServerClient();

  await Promise.all([
    payload.categories.length
      ? supabase.from("transaction_categories").upsert(payload.categories.map((item) => ({ ...item, household_id: householdId })))
      : Promise.resolve({ error: null }),
    payload.transactions.length
      ? supabase.from("transactions").upsert(payload.transactions.map((item) => ({ ...item, household_id: householdId })))
      : Promise.resolve({ error: null }),
    payload.goals.length
      ? supabase.from("goals").upsert(payload.goals.map((item) => ({ ...item, household_id: householdId })))
      : Promise.resolve({ error: null }),
    payload.budgets.length
      ? supabase.from("budgets").upsert(payload.budgets.map((item) => ({ ...item, household_id: householdId })))
      : Promise.resolve({ error: null }),
    payload.invoices.length
      ? supabase.from("invoices").upsert(payload.invoices.map((item) => ({ ...item, household_id: householdId })))
      : Promise.resolve({ error: null })
  ]);

  return { ok: true };
}
