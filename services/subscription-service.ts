import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

function getMonthEnd(month: string) {
  const [year, monthValue] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthValue, 0)).toISOString().slice(0, 10);
}

function getDueDate(month: string, billingDay: number) {
  return `${month}-${String(billingDay).padStart(2, "0")}`;
}

function mapCycleStatus(status: "pending" | "paid" | "overdue", dueDate: string) {
  if (status === "paid") return "paid" as const;
  if (new Date(`${dueDate}T00:00:00.000Z`) < new Date()) return "overdue" as const;
  return "unpaid" as const;
}

export async function ensureSubscriptionCyclesForMonth(month: string) {
  const { householdId } = await getHouseholdContext();
  const supabase = createSupabaseServerClient();
  const monthEnd = getMonthEnd(month);

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id, amount, billing_day, start_date, status")
    .eq("household_id", householdId)
    .eq("status", "active")
    .lte("start_date", monthEnd);

  if (subscriptionError) throw subscriptionError;
  if (!subscriptions.length) return;

  const subscriptionIds = subscriptions.map((item) => item.id);
  const { data: cycles, error: cycleError } = await supabase
    .from("subscription_cycles")
    .select("subscription_id")
    .eq("household_id", householdId)
    .eq("month", month)
    .in("subscription_id", subscriptionIds);

  if (cycleError) throw cycleError;

  const existingIds = new Set(cycles.map((cycle) => cycle.subscription_id));
  const inserts = subscriptions
    .filter((subscription) => !existingIds.has(subscription.id))
    .map((subscription) => ({
      household_id: householdId,
      subscription_id: subscription.id,
      month,
      amount: subscription.amount,
      due_date: getDueDate(month, subscription.billing_day),
      status: "pending" as const
    }));

  if (!inserts.length) return;

  const { error: insertError } = await supabase.from("subscription_cycles").insert(inserts);
  if (insertError) throw insertError;
}

export async function getSubscriptions(month: string) {
  await ensureSubscriptionCyclesForMonth(month);

  const { householdId } = await getHouseholdContext();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      subscription_cycles!left (
        id,
        month,
        due_date,
        status,
        linked_transaction_id
      )
    `)
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((item) => {
    const cycles = (item.subscription_cycles ?? []) as Array<{
      id: string;
      month: string;
      due_date: string;
      status: "pending" | "paid" | "overdue";
      linked_transaction_id: string | null;
    }>;
    const cycle = cycles.find((entry) => entry.month === month);
    const dueDate = cycle?.due_date ?? getDueDate(month, item.billing_day);
    return {
      id: item.id,
      name: item.name,
      vendor: item.vendor,
      amount: item.amount,
      billingDay: item.billing_day,
      categoryId: item.category_id,
      paymentMethod: item.payment_method,
      startDate: item.start_date,
      status: item.status,
      notes: item.notes,
      cycle: {
        id: cycle?.id ?? "",
        month,
        dueDate,
        status: mapCycleStatus((cycle?.status ?? "pending") as "pending" | "paid" | "overdue", dueDate),
        linkedTransactionId: cycle?.linked_transaction_id ?? null
      }
    };
  });
}
