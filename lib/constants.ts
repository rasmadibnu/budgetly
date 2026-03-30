import type { InvoiceStatus, Recurrence, TransactionType } from "@/types/database";

export const APP_NAME = "Budgetly";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/goals", label: "Goals" },
  { href: "/budgets", label: "Budgets" },
  { href: "/invoice", label: "Invoice" },
  { href: "/settings", label: "Settings" }
];

export const TRANSACTION_TYPES: TransactionType[] = ["income", "expense"];
export const INVOICE_RECURRENCES: Recurrence[] = ["monthly", "yearly", "one-time"];
export const INVOICE_STATUSES: InvoiceStatus[] = ["pending", "paid", "overdue"];
