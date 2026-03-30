"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";
import { invoiceSchema, type InvoiceInput } from "@/features/invoices/schemas/invoice-schema";

function getCurrentJakartaDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function revalidateInvoices() {
  revalidatePath("/dashboard");
  revalidatePath("/invoice");
  revalidatePath("/transactions");
  revalidatePath("/reports");
}

async function ensureFreelanceIncomeCategory(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, householdId: string) {
  const { data: existing, error: existingError } = await supabase
    .from("transaction_categories")
    .select("id")
    .eq("household_id", householdId)
    .eq("type", "income")
    .eq("name", "Freelance")
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase
    .from("transaction_categories")
    .insert({
      household_id: householdId,
      name: "Freelance",
      type: "income",
      color: "#22c55e"
    })
    .select("id")
    .single();

  if (createError || !created) throw createError ?? new Error("Unable to create freelance income category");
  return created.id;
}

async function removeInvoiceIncomeLinks(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, invoiceId: string) {
  const { data: payments, error: paymentsError } = await supabase
    .from("invoice_payments")
    .select("id, transaction_id")
    .eq("invoice_id", invoiceId);

  if (paymentsError) throw paymentsError;

  const transactionIds = (payments ?? []).flatMap((payment) => (payment.transaction_id ? [payment.transaction_id] : []));

  if (transactionIds.length) {
    const { error: deleteTransactionsError } = await supabase.from("transactions").delete().in("id", transactionIds);
    if (deleteTransactionsError) throw deleteTransactionsError;
  }

  if ((payments ?? []).length) {
    const { error: deletePaymentsError } = await supabase.from("invoice_payments").delete().eq("invoice_id", invoiceId);
    if (deletePaymentsError) throw deletePaymentsError;
  }
}

async function syncInvoiceIncomeTransaction({
  supabase,
  householdId,
  userId,
  invoiceId,
  name,
  clientName,
  amount,
  status,
  dueDate,
  issuedDate
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  householdId: string;
  userId: string;
  invoiceId: string;
  name: string;
  clientName: string | null;
  amount: number;
  status: "paid" | "unpaid";
  dueDate: string;
  issuedDate: string | null;
}) {
  if (status === "unpaid") {
    await removeInvoiceIncomeLinks(supabase, invoiceId);
    return;
  }

  const categoryId = await ensureFreelanceIncomeCategory(supabase, householdId);
  const { data: existingPayment, error: existingPaymentError } = await supabase
    .from("invoice_payments")
    .select("id, transaction_id, paid_at")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPaymentError) throw existingPaymentError;

  const paidAt = existingPayment?.paid_at ?? new Date().toISOString();
  const description = clientName ? `Freelance invoice: ${name} · ${clientName}` : `Freelance invoice: ${name}`;
  const transactionDate = (existingPayment?.paid_at?.slice(0, 10) || getCurrentJakartaDate() || dueDate || issuedDate || getCurrentJakartaDate());

  let transactionId = existingPayment?.transaction_id ?? null;

  if (transactionId) {
    const { error: updateTransactionError } = await supabase
      .from("transactions")
      .update({
        user_id: userId,
        type: "income",
        amount,
        category_id: categoryId,
        description,
        date: transactionDate,
        payment_method: null,
        attachment_url: null,
        is_recurring: false,
        recurrence_rule: null
      })
      .eq("id", transactionId);

    if (updateTransactionError) throw updateTransactionError;
  } else {
    const { data: transaction, error: insertTransactionError } = await supabase
      .from("transactions")
      .insert({
        household_id: householdId,
        user_id: userId,
        type: "income",
        amount,
        category_id: categoryId,
        description,
        date: transactionDate,
        payment_method: null,
        attachment_url: null,
        is_recurring: false,
        recurrence_rule: null
      })
      .select("id")
      .single();

    if (insertTransactionError || !transaction) {
      throw insertTransactionError ?? new Error("Unable to create invoice income transaction");
    }

    transactionId = transaction.id;
  }

  if (existingPayment?.id) {
    const { error: updatePaymentError } = await supabase
      .from("invoice_payments")
      .update({
        transaction_id: transactionId,
        paid_at: paidAt,
        amount
      })
      .eq("id", existingPayment.id);

    if (updatePaymentError) throw updatePaymentError;
  } else {
    const { error: insertPaymentError } = await supabase.from("invoice_payments").insert({
      invoice_id: invoiceId,
      transaction_id: transactionId,
      paid_at: paidAt,
      amount
    });

    if (insertPaymentError) throw insertPaymentError;
  }
}

export async function createInvoice(input: InvoiceInput) {
  const parsed = invoiceSchema.parse(input);
  const { householdId, user } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
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
    })
    .select("id")
    .single();

  if (error || !invoice) throw error ?? new Error("Unable to create invoice");

  await syncInvoiceIncomeTransaction({
    supabase,
    householdId,
    userId: user.id,
    invoiceId: invoice.id,
    name: parsed.name,
    clientName: parsed.clientName,
    amount: parsed.amount,
    status: parsed.status,
    dueDate: parsed.dueDate,
    issuedDate: parsed.issuedDate
  });

  revalidateInvoices();
}

export async function updateInvoice(input: InvoiceInput) {
  const parsed = invoiceSchema.extend({ id: z.string().uuid() }).parse(input);
  const { householdId, user } = await getHouseholdContext();
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

  await syncInvoiceIncomeTransaction({
    supabase,
    householdId,
    userId: user.id,
    invoiceId: parsed.id,
    name: parsed.name,
    clientName: parsed.clientName,
    amount: parsed.amount,
    status: parsed.status,
    dueDate: parsed.dueDate,
    issuedDate: parsed.issuedDate
  });

  revalidateInvoices();
}

export async function updateInvoicePaymentStatus(id: string, status: "paid" | "unpaid") {
  const { householdId, user } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id, name, client_name, amount, issued_date, due_date")
    .eq("id", id)
    .single();

  if (invoiceError || !invoice) throw invoiceError ?? new Error("Invoice not found");

  const { error } = await supabase
    .from("invoices")
    .update({
      status: status === "paid" ? "paid" : "pending",
      last_paid_at: status === "paid" ? new Date().toISOString() : null
    })
    .eq("id", id);
  if (error) throw error;

  await syncInvoiceIncomeTransaction({
    supabase,
    householdId,
    userId: user.id,
    invoiceId: id,
    name: invoice.name,
    clientName: invoice.client_name,
    amount: invoice.amount,
    status,
    dueDate: invoice.due_date,
    issuedDate: invoice.issued_date
  });

  revalidateInvoices();
}

export async function deleteInvoice(id: string) {
  const supabase = await createSupabaseServerClient();
  await removeInvoiceIncomeLinks(supabase, id);
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) throw error;
  revalidateInvoices();
}
