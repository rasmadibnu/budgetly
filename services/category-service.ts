import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

export async function getCategories() {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("transaction_categories")
    .select("id, name, type, color, report_group")
    .eq("household_id", householdId)
    .order("name");

  if (error) throw error;
  return (data ?? []).map((category) => ({
    id: category.id,
    name: category.name,
    type: category.type,
    color: category.color,
    reportGroup: category.report_group
  }));
}
