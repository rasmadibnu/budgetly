"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { debtBaseSchema, debtSchema, type DebtInput } from "@/features/debts/schemas/debt-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

function revalidateDebts() {
  revalidatePath("/debts");
}

export async function createDebtReceivable(input: DebtInput) {
  const parsed = debtSchema.parse(input);
  const { householdId } = await getHouseholdContext();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("debts_receivables").insert({
    household_id: householdId,
    direction: parsed.direction,
    name: parsed.name,
    counterparty: parsed.counterparty,
    total_amount: parsed.totalAmount,
    paid_amount: parsed.paidAmount,
    due_date: parsed.dueDate || null,
    status: parsed.status,
    notes: parsed.notes || null
  });

  if (error) throw error;
  revalidateDebts();
}

export async function updateDebtReceivable(input: DebtInput) {
  const parsed = z.object({ id: z.string().uuid() }).merge(debtBaseSchema.omit({ id: true })).parse(input);
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("debts_receivables")
    .update({
      direction: parsed.direction,
      name: parsed.name,
      counterparty: parsed.counterparty,
      total_amount: parsed.totalAmount,
      paid_amount: parsed.paidAmount,
      due_date: parsed.dueDate || null,
      status: parsed.status,
      notes: parsed.notes || null
    })
    .eq("id", parsed.id);

  if (error) throw error;
  revalidateDebts();
}

export async function updateDebtReceivableStatus(id: string, status: "open" | "settled") {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("debts_receivables")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
  revalidateDebts();
}

export async function deleteDebtReceivable(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("debts_receivables").delete().eq("id", id);
  if (error) throw error;
  revalidateDebts();
}
