import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

export async function getInvestments() {
  const { householdId } = await getHouseholdContext();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("investments")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data.map((item) => ({
    id: item.id,
    name: item.name,
    platform: item.platform,
    type: item.type,
    amount: item.amount,
    currentValue: item.current_value,
    gainLoss: item.current_value - item.amount,
    startedAt: item.started_at,
    status: item.status,
    notes: item.notes
  }));
}
