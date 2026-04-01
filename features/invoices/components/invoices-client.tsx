"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleDashed, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { MoneyValue } from "@/components/ui/money-value";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/feedback/empty-state";
import { InvoiceFormDialog } from "@/features/invoices/components/invoice-form-dialog";
import { deleteInvoice, updateInvoicePaymentStatus } from "@/features/invoices/server/actions";
import type { InvoiceInput } from "@/features/invoices/schemas/invoice-schema";
import type { InvoiceItem } from "@/types/app";
import { formatDate, formatStatusLabel } from "@/utils/format";

export function InvoicesClient({ initialInvoices }: { initialInvoices: InvoiceItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceInput | undefined>(undefined);
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceItem | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const updateStatus = (invoice: InvoiceItem, status: "paid" | "unpaid") => {
    startTransition(async () => {
      try {
        await updateInvoicePaymentStatus(invoice.id, status);
        toast.success(`Invoice marked as ${formatStatusLabel(status)}`);
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
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Invoice"
        title="🧾 Client invoices"
        description="Track invoices issued to your clients and mark each one as paid or unpaid."
        actions={
          <Button className="shrink-0 md:h-9 md:px-4 md:py-2" size="icon" onClick={() => {
            setEditingInvoice(undefined);
            setDialogOpen(true);
          }} aria-label="Add invoice" title="Add invoice">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="sr-only md:not-sr-only">Add invoice</span>
          </Button>
        }
      />
      <InvoiceFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => router.refresh()}
        initialData={editingInvoice}
      />
      <ConfirmDialog
        open={Boolean(deletingInvoice)}
        onOpenChange={(open) => !open && setDeletingInvoice(null)}
        title="Delete invoice?"
        description={deletingInvoice ? `This will permanently remove "${deletingInvoice.name}".` : "This invoice will be removed permanently."}
        isPending={isPending}
        onConfirm={() => deletingInvoice && onDelete(deletingInvoice)}
      />
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Billed</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={totalBilled} compact className="sm:hidden" /><MoneyValue value={totalBilled} className="hidden sm:inline" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Collected</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={totalCollected} compact className="sm:hidden" /><MoneyValue value={totalCollected} className="hidden sm:inline" /></div>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{paidInvoices.length} paid</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 md:col-span-1">
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Outstanding</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={totalOutstanding} compact className="sm:hidden" /><MoneyValue value={totalOutstanding} className="hidden sm:inline" /></div>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{unpaidInvoices.length} unpaid</p>
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
                      {formatStatusLabel(invoice.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {invoice.clientName ?? "Client"} &middot; Issued {invoice.issuedDate ? formatDate(invoice.issuedDate) : "-"} &middot; Due {formatDate(invoice.dueDate)}
                  </p>
                  {invoice.notes ? <p className="mt-1 text-[12px] text-muted-foreground">{invoice.notes}</p> : null}
                </div>
                <div className="hidden w-full flex-col gap-2 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                  <MoneyValue value={invoice.amount} className="text-sm font-semibold" />
                  <Button
                    variant={invoice.status === "paid" ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => updateStatus(invoice, invoice.status === "paid" ? "unpaid" : "paid")}
                    disabled={isPending}
                    aria-label={`Mark ${invoice.name} as paid`}
                    title={invoice.status === "paid" ? "Mark as unpaid" : "Mark as paid"}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" aria-label={`Open actions for ${invoice.name}`}>
                        <Ellipsis className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-52 p-2">
                      <div className="grid gap-1">
                        <Button variant="outline" className="justify-start" onClick={() => onEdit(invoice)} disabled={isPending}>
                          <Pencil className="h-4 w-4" />
                          Edit invoice
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start"
                          onClick={() => updateStatus(invoice, invoice.status === "paid" ? "unpaid" : "paid")}
                          disabled={isPending}
                        >
                          {invoice.status === "paid" ? <CircleDashed className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                          {invoice.status === "paid" ? "Mark as unpaid" : "Mark as paid"}
                        </Button>
                        <Button variant="outline" className="justify-start border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingInvoice(invoice)} disabled={isPending}>
                          <Trash2 className="h-4 w-4" />
                          Delete invoice
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center justify-between border-t border-border/70 pt-3 sm:hidden">
                  <MoneyValue value={invoice.amount} className="text-sm font-semibold" />
                  <div className="flex items-center gap-2">
                    <Button
                      variant={invoice.status === "paid" ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => updateStatus(invoice, invoice.status === "paid" ? "unpaid" : "paid")}
                      disabled={isPending}
                      aria-label={`Toggle paid status for ${invoice.name}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setSelectedInvoice(invoice)} aria-label={`Open actions for ${invoice.name}`}>
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <Sheet open={Boolean(selectedInvoice)} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Invoice actions</SheetTitle>
            <SheetDescription>
              {selectedInvoice ? selectedInvoice.name : "Choose what to do with this invoice."}
            </SheetDescription>
          </SheetHeader>
          {selectedInvoice ? (
            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">{selectedInvoice.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedInvoice.clientName ?? "Client"}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <MoneyValue value={selectedInvoice.amount} className="font-semibold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-center" onClick={() => { onEdit(selectedInvoice); setSelectedInvoice(null); }}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="justify-center"
                  onClick={() => { updateStatus(selectedInvoice, "paid"); setSelectedInvoice(null); }}
                  disabled={selectedInvoice.status === "paid" || isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Paid
                </Button>
                <Button
                  variant="outline"
                  className="justify-center"
                  onClick={() => { updateStatus(selectedInvoice, "unpaid"); setSelectedInvoice(null); }}
                  disabled={selectedInvoice.status === "unpaid" || isPending}
                >
                  <CircleDashed className="h-4 w-4" />
                  Unpaid
                </Button>
                <Button variant="outline" className="justify-center border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setDeletingInvoice(selectedInvoice); setSelectedInvoice(null); }} disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
