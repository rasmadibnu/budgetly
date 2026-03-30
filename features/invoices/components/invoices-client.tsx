"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleDashed, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoneyValue } from "@/components/ui/money-value";
import { EmptyState } from "@/components/feedback/empty-state";
import { InvoiceFormDialog } from "@/features/invoices/components/invoice-form-dialog";
import { deleteInvoice, updateInvoicePaymentStatus } from "@/features/invoices/server/actions";
import type { InvoiceInput } from "@/features/invoices/schemas/invoice-schema";
import type { InvoiceItem } from "@/types/app";
import { formatDate } from "@/utils/format";

export function InvoicesClient({ initialInvoices }: { initialInvoices: InvoiceItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceInput | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const updateStatus = (invoice: InvoiceItem, status: "paid" | "unpaid") => {
    startTransition(async () => {
      try {
        await updateInvoicePaymentStatus(invoice.id, status);
        toast.success(`Invoice marked as ${status}`);
        router.refresh();
      } catch {
        toast.error("Unable to update invoice status");
      }
    });
  };

  const onEdit = (invoice: InvoiceItem) => {
    setEditingInvoice({
      id: invoice.id,
      name: invoice.name,
      clientName: invoice.clientName ?? "",
      amount: invoice.amount,
      issuedDate: invoice.issuedDate ?? new Date().toISOString().slice(0, 10),
      dueDate: invoice.dueDate,
      status: invoice.status,
      notes: invoice.notes ?? ""
    });
    setDialogOpen(true);
  };

  const onDelete = (invoice: InvoiceItem) => {
    startTransition(async () => {
      try {
        await deleteInvoice(invoice.id);
        toast.success("Invoice deleted");
        router.refresh();
      } catch {
        toast.error("Unable to delete invoice");
      }
    });
  };

  const paidInvoices = initialInvoices.filter((invoice) => invoice.status === "paid");
  const unpaidInvoices = initialInvoices.filter((invoice) => invoice.status === "unpaid");
  const totalBilled = initialInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalCollected = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const totalOutstanding = unpaidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Invoice"
        title="🧾 Client invoices"
        description="Track invoices issued to your clients and mark each one as paid or unpaid."
        actions={
          <Button onClick={() => {
            setEditingInvoice(undefined);
            setDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add invoice
          </Button>
        }
      />
      <InvoiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => router.refresh()}
        initialData={editingInvoice}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total billed</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={totalBilled} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Collected</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={totalCollected} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{paidInvoices.length} paid invoice(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Outstanding</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={totalOutstanding} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{unpaidInvoices.length} unpaid invoice(s)</p>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-4">
        {!initialInvoices.length ? (
          <EmptyState title="No invoices yet" description="Create your first client invoice and track payment status here." />
        ) : (
          initialInvoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{invoice.name}</h3>
                    <Badge variant={invoice.status === "paid" ? "success" : "secondary"}>
                      {invoice.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {invoice.clientName ?? "Client"} &middot; Issued {invoice.issuedDate ? formatDate(invoice.issuedDate) : "-"} &middot; Due {formatDate(invoice.dueDate)}
                  </p>
                  {invoice.notes ? <p className="mt-1 text-[12px] text-muted-foreground">{invoice.notes}</p> : null}
                </div>
                <div className="flex items-center gap-3">
                  <MoneyValue value={invoice.amount} className="text-sm font-semibold" />
                  <Button variant="outline" size="sm" onClick={() => onEdit(invoice)} disabled={isPending}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant={invoice.status === "paid" ? "secondary" : "outline"} size="sm" onClick={() => updateStatus(invoice, "paid")} disabled={invoice.status === "paid" || isPending}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Paid
                  </Button>
                  <Button variant={invoice.status === "unpaid" ? "secondary" : "outline"} size="sm" onClick={() => updateStatus(invoice, "unpaid")} disabled={invoice.status === "unpaid" || isPending}>
                    <CircleDashed className="mr-2 h-4 w-4" />
                    Unpaid
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDelete(invoice)} disabled={isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
