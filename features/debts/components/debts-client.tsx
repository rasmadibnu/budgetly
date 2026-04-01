"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { MoneyValue } from "@/components/ui/money-value";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/feedback/empty-state";
import { DebtFormDialog } from "@/features/debts/components/debt-form-dialog";
import { deleteDebtReceivable, updateDebtReceivableStatus } from "@/features/debts/server/actions";
import type { DebtInput } from "@/features/debts/schemas/debt-schema";
import type { DebtReceivableItem } from "@/types/app";
import { formatDate, formatStatusLabel } from "@/utils/format";

export function DebtsClient({ initialItems }: { initialItems: DebtReceivableItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DebtInput | undefined>();
  const [deletingItem, setDeletingItem] = useState<DebtReceivableItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<DebtReceivableItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onEdit = (item: DebtReceivableItem) => {
    setEditingItem({
      id: item.id,
      direction: item.direction,
      name: item.name,
      counterparty: item.counterparty,
      totalAmount: item.totalAmount,
      paidAmount: item.paidAmount,
      dueDate: item.dueDate ?? "",
      status: item.status,
      notes: item.notes ?? ""
    });
    setDialogOpen(true);
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteDebtReceivable(id);
        toast.success("Record deleted");
        router.refresh();
      } catch {
        toast.error("Unable to delete record");
      }
    });
  };

  const toggleStatus = (item: DebtReceivableItem) => {
    startTransition(async () => {
      try {
        const nextStatus = item.status === "settled" ? "open" : "settled";
        await updateDebtReceivableStatus(item.id, nextStatus);
        toast.success(`Record marked ${formatStatusLabel(nextStatus)}`);
        router.refresh();
      } catch {
        toast.error("Unable to update record status");
      }
    });
  };

  const debts = initialItems.filter((item) => item.direction === "debt");
  const receivables = initialItems.filter((item) => item.direction === "receivable");
  const totalDebt = debts.reduce((sum, item) => sum + item.remainingAmount, 0);
  const totalReceivable = receivables.reduce((sum, item) => sum + item.remainingAmount, 0);
  const settledCount = initialItems.filter((item) => item.status === "settled").length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Debt / Receivables"
        title="🤝 Track money owed in both directions"
        description="Keep family debts and incoming receivables visible in one place."
        actions={<Button className="shrink-0 md:h-9 md:px-4 md:py-2" size="icon" onClick={() => { setEditingItem(undefined); setDialogOpen(true); }} aria-label="Add record" title="Add record"><Plus className="h-4 w-4 md:mr-2" /><span className="sr-only md:not-sr-only">Add record</span></Button>}
      />
      <DebtFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => router.refresh()} initialData={editingItem} />
      <ConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete record?"
        description={deletingItem ? `This will permanently remove "${deletingItem.name}".` : "This record will be removed permanently."}
        isPending={isPending}
        onConfirm={() => deletingItem && onDelete(deletingItem.id)}
      />
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Debt</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={totalDebt} compact className="sm:hidden" /><MoneyValue value={totalDebt} className="hidden sm:inline" /></div>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{debts.length} record(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Receivable</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={totalReceivable} compact className="sm:hidden" /><MoneyValue value={totalReceivable} className="hidden sm:inline" /></div>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{receivables.length} record(s)</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 md:col-span-1">
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Settled</p>
            <p className="mt-1 text-base font-semibold sm:text-xl">{settledCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{initialItems.length - settledCount} open</p>
          </CardContent>
        </Card>
      </div>
      {!initialItems.length ? (
        <EmptyState title="No records yet" description="Add a debt or receivable so payment progress is easier to monitor." />
      ) : (
        <div className="space-y-4">
          {initialItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{item.name}</h3>
                      <Badge variant={item.direction === "receivable" ? "success" : "secondary"}>{formatStatusLabel(item.direction)}</Badge>
                      <Badge variant={item.status === "settled" ? "success" : "outline"}>{formatStatusLabel(item.status)}</Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {item.counterparty} {item.dueDate ? `· Due ${formatDate(item.dueDate)}` : ""}
                    </p>
                    {item.notes ? <p className="mt-1 text-[12px] text-muted-foreground">{item.notes}</p> : null}
                  </div>
                  <div className="hidden w-full flex-col gap-2 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <MoneyValue value={item.remainingAmount} className="text-sm font-semibold" />
                    <Button
                      variant={item.status === "settled" ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => toggleStatus(item)}
                      disabled={isPending}
                      aria-label={`Toggle status for ${item.name}`}
                      title={item.status === "settled" ? "Mark as open" : "Mark as settled"}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" aria-label={`Open actions for ${item.name}`}>
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-52 p-2">
                        <div className="grid gap-1">
                          <Button variant="outline" className="justify-start" onClick={() => onEdit(item)} disabled={isPending}>
                            <Pencil className="h-4 w-4" />
                            Edit record
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => toggleStatus(item)}
                            disabled={isPending}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {item.status === "settled" ? "Mark as open" : "Mark as settled"}
                          </Button>
                          <Button variant="outline" className="justify-start border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingItem(item)} disabled={isPending}>
                            <Trash2 className="h-4 w-4" />
                            Delete record
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-muted-foreground">Total</p><MoneyValue value={item.totalAmount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Paid</p><MoneyValue value={item.paidAmount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Remaining</p><MoneyValue value={item.remainingAmount} className="font-semibold" /></div>
                </div>
                <div className="flex items-center justify-between border-t border-border/70 pt-3 sm:hidden">
                  <span className="text-xs text-muted-foreground">{formatStatusLabel(item.status)}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={item.status === "settled" ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => toggleStatus(item)}
                      disabled={isPending}
                      aria-label={`Toggle status for ${item.name}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setSelectedItem(item)} aria-label={`Open actions for ${item.name}`}>
                      <Ellipsis className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Sheet open={Boolean(selectedItem)} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Record actions</SheetTitle>
            <SheetDescription>
              {selectedItem ? selectedItem.name : "Choose what to do with this record."}
            </SheetDescription>
          </SheetHeader>
          {selectedItem ? (
            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">{selectedItem.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedItem.counterparty}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <MoneyValue value={selectedItem.remainingAmount} className="font-semibold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-center" onClick={() => { onEdit(selectedItem); setSelectedItem(null); }}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="justify-center"
                  disabled={isPending}
                  onClick={() => { toggleStatus(selectedItem); setSelectedItem(null); }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {selectedItem.status === "settled" ? "Open" : "Settle"}
                </Button>
                <Button variant="outline" className="col-span-2 justify-center border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isPending} onClick={() => { setDeletingItem(selectedItem); setSelectedItem(null); }}>
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
