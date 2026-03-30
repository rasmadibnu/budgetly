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
import { InvestmentFormDialog } from "@/features/investments/components/investment-form-dialog";
import { deleteInvestment } from "@/features/investments/server/actions";
import type { InvestmentInput } from "@/features/investments/schemas/investment-schema";
import type { InvestmentItem } from "@/types/app";
import { cn } from "@/utils/cn";
import { formatDate, formatStatusLabel } from "@/utils/format";

export function InvestmentsClient({ initialItems }: { initialItems: InvestmentItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvestmentInput | undefined>();
  const [deletingItem, setDeletingItem] = useState<InvestmentItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onEdit = (item: InvestmentItem) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      platform: item.platform ?? "",
      type: item.type,
      amount: item.amount,
      currentValue: item.currentValue,
      startedAt: item.startedAt,
      status: item.status,
      notes: item.notes ?? ""
    });
    setDialogOpen(true);
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteInvestment(id);
        toast.success("Investment deleted");
        router.refresh();
      } catch {
        toast.error("Unable to delete investment");
      }
    });
  };

  const totalInvested = initialItems.reduce((sum, item) => sum + item.amount, 0);
  const totalCurrentValue = initialItems.reduce((sum, item) => sum + item.currentValue, 0);
  const totalGainLoss = initialItems.reduce((sum, item) => sum + item.gainLoss, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Investments"
        title="📈 Monitor family capital growth"
        description="Track invested principal, current market value, and realized posture across accounts."
        actions={<Button onClick={() => { setEditingItem(undefined); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add investment</Button>}
      />
      <InvestmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => router.refresh()} initialData={editingItem} />
      <ConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete investment?"
        description={deletingItem ? `This will permanently remove "${deletingItem.name}".` : "This investment will be removed permanently."}
        isPending={isPending}
        onConfirm={() => deletingItem && onDelete(deletingItem.id)}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total invested</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={totalInvested} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Current portfolio value</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={totalCurrentValue} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Net gain / loss</p>
            <MoneyValue value={totalGainLoss} className={cn("mt-1 text-xl font-semibold", totalGainLoss >= 0 ? "text-emerald-500" : "text-rose-500")} />
          </CardContent>
        </Card>
      </div>
      {!initialItems.length ? (
        <EmptyState title="No investments yet" description="Add the first investment account or asset so growth is visible over time." />
      ) : (
        <div className="space-y-4">
          {initialItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{item.name}</h3>
                      <Badge variant={item.status === "active" ? "success" : "secondary"}>{formatStatusLabel(item.status)}</Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {item.type}{item.platform ? ` · ${item.platform}` : ""} · Started {formatDate(item.startedAt)}
                    </p>
                    {item.notes ? <p className="mt-1 text-[12px] text-muted-foreground">{item.notes}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(item)} disabled={isPending}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingItem(item)} disabled={isPending}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  </div>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-muted-foreground">Invested</p><MoneyValue value={item.amount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Current value</p><MoneyValue value={item.currentValue} className="font-semibold" /></div>
                  <div>
                    <p className="text-muted-foreground">Gain / Loss</p>
                    <MoneyValue value={item.gainLoss} className={cn("font-semibold", item.gainLoss >= 0 ? "text-emerald-500" : "text-rose-500")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
