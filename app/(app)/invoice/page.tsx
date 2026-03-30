import { InvoicesClient } from "@/features/invoices/components/invoices-client";
import { getInvoices } from "@/services/invoice-service";

export default async function InvoicePage() {
  const invoices = await getInvoices();
  return <InvoicesClient initialInvoices={invoices} />;
}
