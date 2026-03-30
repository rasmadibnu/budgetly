import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

export async function getDebtsReceivables() {
  const { householdId } = await getHouseholdContext();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("debts_receivables")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((item) => ({
    id: item.id,
    direction: item.direction,
    name: item.name,
    counterparty: item.counterparty,
    totalAmount: item.total_amount,
    paidAmount: item.paid_amount,
    remainingAmount: Math.max(item.total_amount - item.paid_amount, 0),
    dueDate: item.due_date,
    status: item.status,
    notes: item.notes
  }));
}
