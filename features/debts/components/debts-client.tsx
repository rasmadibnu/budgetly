"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { MoneyValue } from "@/components/ui/money-value";
import { EmptyState } from "@/components/feedback/empty-state";
import { DebtFormDialog } from "@/features/debts/components/debt-form-dialog";
import { deleteDebtReceivable } from "@/features/debts/server/actions";
import type { DebtInput } from "@/features/debts/schemas/debt-schema";
import type { DebtReceivableItem } from "@/types/app";
import { formatDate, formatStatusLabel } from "@/utils/format";

export function DebtsClient({ initialItems }: { initialItems: DebtReceivableItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DebtInput | undefined>();
  const [deletingItem, setDeletingItem] = useState<DebtReceivableItem | null>(null);
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

  const debts = initialItems.filter((item) => item.direction === "debt");
  const receivables = initialItems.filter((item) => item.direction === "receivable");
  const totalDebt = debts.reduce((sum, item) => sum + item.remainingAmount, 0);
  const totalReceivable = receivables.reduce((sum, item) => sum + item.remainingAmount, 0);
  const settledCount = initialItems.filter((item) => item.status === "settled").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Debt / Receivables"
        title="🤝 Track money owed in both directions"
        description="Keep family debts and incoming receivables visible in one place."
        actions={<Button className="w-full sm:w-auto" onClick={() => { setEditingItem(undefined); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add record</Button>}
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Remaining debt</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={totalDebt} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{debts.length} debt record(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Receivable balance</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={totalReceivable} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{receivables.length} receivable record(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Settled records</p>
            <p className="mt-1 text-xl font-semibold">{settledCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">{initialItems.length - settledCount} still open</p>
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
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => onEdit(item)} disabled={isPending}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                    <Button className="w-full sm:w-auto" variant="outline" size="sm" onClick={() => setDeletingItem(item)} disabled={isPending}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  </div>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-muted-foreground">Total</p><MoneyValue value={item.totalAmount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Paid</p><MoneyValue value={item.paidAmount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Remaining</p><MoneyValue value={item.remainingAmount} className="font-semibold" /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
