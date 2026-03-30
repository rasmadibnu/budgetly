"use server";

import { revalidatePath } from "next/cache";

import { subscriptionSchema, type SubscriptionInput } from "@/features/subscriptions/schemas/subscription-schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { ensureSubscriptionCyclesForMonth } from "@/services/subscription-service";

function revalidateSubscriptions() {
  revalidatePath("/subscriptions");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
}

export async function createSubscription(input: SubscriptionInput) {
  const parsed = subscriptionSchema.parse(input);
  const { householdId } = await getHouseholdContext();
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("subscriptions").insert({
    household_id: householdId,
    name: parsed.name,
    vendor: parsed.vendor,
    amount: parsed.amount,
    billing_day: parsed.billingDay,
    category_id: parsed.categoryId || null,
    payment_method: parsed.paymentMethod || null,
    start_date: parsed.startDate,
    status: parsed.status,
    notes: parsed.notes || null
  });

  if (error) throw error;
  revalidateSubscriptions();
}

export async function updateSubscription(input: SubscriptionInput) {
  const parsed = subscriptionSchema.extend({ id: subscriptionSchema.shape.id.unwrap() }).parse(input);
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({
      name: parsed.name,
      vendor: parsed.vendor,
      amount: parsed.amount,
      billing_day: parsed.billingDay,
      category_id: parsed.categoryId || null,
      payment_method: parsed.paymentMethod || null,
      start_date: parsed.startDate,
      status: parsed.status,
      notes: parsed.notes || null
    })
    .eq("id", parsed.id);

  if (error) throw error;
  revalidateSubscriptions();
}

export async function deleteSubscription(id: string) {
  const supabase = createSupabaseServerClient();
  const { data: cycles, error: cycleError } = await supabase
    .from("subscription_cycles")
    .select("linked_transaction_id")
    .eq("subscription_id", id);

  if (cycleError) throw cycleError;

  const transactionIds = cycles.flatMap((cycle) => cycle.linked_transaction_id ? [cycle.linked_transaction_id] : []);
  if (transactionIds.length) {
    const { error: transactionError } = await supabase.from("transactions").delete().in("id", transactionIds);
    if (transactionError) throw transactionError;
  }

  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) throw error;
  revalidateSubscriptions();
}

export async function setSubscriptionCycleStatus(subscriptionId: string, month: string, status: "paid" | "unpaid") {
  await ensureSubscriptionCyclesForMonth(month);

  const { householdId, user } = await getHouseholdContext();
  const supabase = createSupabaseServerClient();

  const { data: cycle, error: cycleError } = await supabase
    .from("subscription_cycles")
    .select("id, amount, due_date, linked_transaction_id")
    .eq("subscription_id", subscriptionId)
    .eq("household_id", householdId)
    .eq("month", month)
    .single();

  if (cycleError || !cycle) throw cycleError ?? new Error("Subscription cycle not found");

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id, name, category_id, payment_method")
    .eq("id", subscriptionId)
    .single();

  if (subscriptionError || !subscription) throw subscriptionError ?? new Error("Subscription not found");

  let linkedTransactionId = cycle.linked_transaction_id;

  if (status === "paid") {
    if (linkedTransactionId) {
      const { error: updateTransactionError } = await supabase
        .from("transactions")
        .update({
          user_id: user.id,
          amount: cycle.amount,
          category_id: subscription.category_id,
          description: `Subscription: ${subscription.name}`,
          date: cycle.due_date,
          payment_method: subscription.payment_method,
          is_recurring: true,
          recurrence_rule: "monthly"
        })
        .eq("id", linkedTransactionId);

      if (updateTransactionError) throw updateTransactionError;
    } else {
      const { data: transaction, error: insertTransactionError } = await supabase
        .from("transactions")
        .insert({
          household_id: householdId,
          user_id: user.id,
          type: "expense",
          amount: cycle.amount,
          category_id: subscription.category_id,
          description: `Subscription: ${subscription.name}`,
          date: cycle.due_date,
          payment_method: subscription.payment_method,
          is_recurring: true,
          recurrence_rule: "monthly"
        })
        .select("id")
        .single();

      if (insertTransactionError || !transaction) throw insertTransactionError ?? new Error("Unable to create transaction");
      linkedTransactionId = transaction.id;
    }
  } else if (linkedTransactionId) {
    const { error: deleteTransactionError } = await supabase.from("transactions").delete().eq("id", linkedTransactionId);
    if (deleteTransactionError) throw deleteTransactionError;
    linkedTransactionId = null;
  }

  const { error: updateCycleError } = await supabase
    .from("subscription_cycles")
    .update({
      status: status === "paid" ? "paid" : "pending",
      linked_transaction_id: linkedTransactionId,
      paid_at: status === "paid" ? new Date().toISOString() : null
    })
    .eq("id", cycle.id);

  if (updateCycleError) throw updateCycleError;
  revalidateSubscriptions();
}
