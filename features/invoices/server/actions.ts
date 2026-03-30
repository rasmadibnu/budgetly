"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { invoiceSchema, type InvoiceInput } from "@/features/invoices/schemas/invoice-schema";

function revalidateInvoices() {
  revalidatePath("/dashboard");
  revalidatePath("/invoice");
}

export async function createInvoice(input: InvoiceInput) {
  const parsed = invoiceSchema.parse(input);
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("invoices").insert({
    household_id: householdId,
    name: parsed.name,
    client_name: parsed.clientName,
    amount: parsed.amount,
    issued_date: parsed.issuedDate,
    due_date: parsed.dueDate,
    recurrence: "one-time",
    status: parsed.status === "paid" ? "paid" : "pending",
    auto_generate: false,
    notes: parsed.notes ?? null,
    last_paid_at: parsed.status === "paid" ? new Date().toISOString() : null
  });

  if (error) throw error;
  revalidateInvoices();
}

export async function updateInvoice(input: InvoiceInput) {
  const parsed = invoiceSchema.extend({ id: z.string().uuid() }).parse(input);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("invoices")
    .update({
      name: parsed.name,
      client_name: parsed.clientName,
      amount: parsed.amount,
      issued_date: parsed.issuedDate,
      due_date: parsed.dueDate,
      recurrence: "one-time",
      status: parsed.status === "paid" ? "paid" : "pending",
      auto_generate: false,
      notes: parsed.notes ?? null,
      last_paid_at: parsed.status === "paid" ? new Date().toISOString() : null
    })
    .eq("id", parsed.id);

  if (error) throw error;
  revalidateInvoices();
}

export async function updateInvoicePaymentStatus(id: string, status: "paid" | "unpaid") {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("invoices")
    .update({
      status: status === "paid" ? "paid" : "pending",
      last_paid_at: status === "paid" ? new Date().toISOString() : null
    })
    .eq("id", id);
  if (error) throw error;
  revalidateInvoices();
}

export async function deleteInvoice(id: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
  revalidateInvoices();
}
