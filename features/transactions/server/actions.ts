"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { transactionSchema, type TransactionInput } from "@/features/transactions/schemas/transaction-schema";
import { addRecurrence } from "@/utils/date";

function revalidateTransactions() {
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  revalidatePath("/invoice");
}

export async function createTransaction(input: TransactionInput) {
  const parsed = transactionSchema.parse(input);
  const { householdId, user } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("transactions").insert({
    household_id: householdId,
    user_id: user.id,
    type: parsed.type,
    amount: parsed.amount,
    category_id: parsed.categoryId ?? null,
    description: parsed.description ?? null,
    date: parsed.date,
    payment_method: parsed.paymentMethod ?? null,
    attachment_url: parsed.attachmentUrl ?? null,
    is_recurring: parsed.isRecurring,
    recurrence_rule: parsed.isRecurring ? parsed.recurrenceRule ?? "monthly" : null
  });

  if (error) throw error;
  revalidateTransactions();
}

export async function updateTransaction(input: TransactionInput) {
  const parsed = transactionSchema.extend({ id: transactionSchema.shape.id.unwrap() }).parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      type: parsed.type,
      amount: parsed.amount,
      category_id: parsed.categoryId ?? null,
      description: parsed.description ?? null,
      date: parsed.date,
      payment_method: parsed.paymentMethod ?? null,
      attachment_url: parsed.attachmentUrl ?? null,
      is_recurring: parsed.isRecurring,
      recurrence_rule: parsed.isRecurring ? parsed.recurrenceRule ?? "monthly" : null
    })
    .eq("id", parsed.id);

  if (error) throw error;
  revalidateTransactions();
}

export async function deleteTransaction(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
  revalidateTransactions();
}

export async function uploadReceipt(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("A receipt file is required.");
  }

  const { householdId, user } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const path = `${householdId}/${user.id}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("receipts").upload(path, file, {
    upsert: false,
    contentType: file.type
  });

  if (error) throw error;

  const { data } = supabase.storage.from("receipts").getPublicUrl(path);
  return data.publicUrl;
}

export async function generateRecurringTransactions() {
  const { householdId, user } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("household_id", householdId)
    .eq("is_recurring", true)
    .lt("date", today);

  if (error) throw error;

  for (const transaction of data) {
    const nextDate = addRecurrence(transaction.date, transaction.recurrence_rule ?? "monthly");
    if (nextDate.slice(0, 10) <= today) {
      await supabase.from("transactions").insert({
        household_id: householdId,
        user_id: user.id,
        type: transaction.type,
        amount: transaction.amount,
        category_id: transaction.category_id,
        description: transaction.description,
        date: nextDate.slice(0, 10),
        payment_method: transaction.payment_method,
        attachment_url: transaction.attachment_url,
        is_recurring: true,
        recurrence_rule: transaction.recurrence_rule
      });
    }
  }

  revalidateTransactions();
}
