import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

export async function getInvoices() {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("invoices").select("*").eq("household_id", householdId).order("due_date");

  if (error) throw error;

  return data.map((invoice) => ({
    id: invoice.id,
    name: invoice.name,
    clientName: invoice.client_name,
    amount: invoice.amount,
    issuedDate: invoice.issued_date,
    dueDate: invoice.due_date,
    status: (invoice.status === "paid" ? "paid" : "unpaid") as "paid" | "unpaid",
    notes: invoice.notes
  }));
}
