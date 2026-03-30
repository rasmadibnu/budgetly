"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { investmentSchema, type InvestmentInput } from "@/features/investments/schemas/investment-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

function revalidateInvestments() {
  revalidatePath("/investments");
}

export async function createInvestment(input: InvestmentInput) {
  const parsed = investmentSchema.parse(input);
  const { householdId } = await getHouseholdContext();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("investments").insert({
    household_id: householdId,
    name: parsed.name,
    platform: parsed.platform || null,
    type: parsed.type,
    amount: parsed.amount,
    current_value: parsed.currentValue,
    started_at: parsed.startedAt,
    status: parsed.status,
    notes: parsed.notes || null
  });

  if (error) throw error;
  revalidateInvestments();
}

export async function updateInvestment(input: InvestmentInput) {
  const parsed = investmentSchema.extend({ id: z.string().uuid() }).parse(input);
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("investments")
    .update({
      name: parsed.name,
      platform: parsed.platform || null,
      type: parsed.type,
      amount: parsed.amount,
      current_value: parsed.currentValue,
      started_at: parsed.startedAt,
      status: parsed.status,
      notes: parsed.notes || null
    })
    .eq("id", parsed.id);

  if (error) throw error;
  revalidateInvestments();
}

export async function deleteInvestment(id: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("investments").delete().eq("id", id);
  if (error) throw error;
  revalidateInvestments();
}
