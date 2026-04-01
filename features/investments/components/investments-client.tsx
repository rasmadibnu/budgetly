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
import { InvestmentFormDialog } from "@/features/investments/components/investment-form-dialog";
import { deleteInvestment, updateInvestmentStatus } from "@/features/investments/server/actions";
import type { InvestmentInput } from "@/features/investments/schemas/investment-schema";
import type { InvestmentItem } from "@/types/app";
import { cn } from "@/utils/cn";
import { formatDate, formatStatusLabel } from "@/utils/format";

export function InvestmentsClient({ initialItems }: { initialItems: InvestmentItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InvestmentInput | undefined>();
  const [deletingItem, setDeletingItem] = useState<InvestmentItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InvestmentItem | null>(null);
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

  const toggleStatus = (item: InvestmentItem) => {
    startTransition(async () => {
      try {
        const nextStatus = item.status === "closed" ? "active" : "closed";
        await updateInvestmentStatus(item.id, nextStatus);
        toast.success(`Investment marked ${formatStatusLabel(nextStatus)}`);
        router.refresh();
      } catch {
        toast.error("Unable to update investment status");
      }
    });
  };

  const totalInvested = initialItems.reduce((sum, item) => sum + item.amount, 0);
  const totalCurrentValue = initialItems.reduce((sum, item) => sum + item.currentValue, 0);
  const totalGainLoss = initialItems.reduce((sum, item) => sum + item.gainLoss, 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Investments"
        title="📈 Monitor family capital growth"
        description="Track invested principal, current market value, and realized posture across accounts."
        actions={<Button className="shrink-0 md:h-9 md:px-4 md:py-2" size="icon" onClick={() => { setEditingItem(undefined); setDialogOpen(true); }} aria-label="Add investment" title="Add investment"><Plus className="h-4 w-4 md:mr-2" /><span className="sr-only md:not-sr-only">Add investment</span></Button>}
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
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Invested</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={totalInvested} compact className="sm:hidden" /><MoneyValue value={totalInvested} className="hidden sm:inline" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Current</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={totalCurrentValue} compact className="sm:hidden" /><MoneyValue value={totalCurrentValue} className="hidden sm:inline" /></div>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 md:col-span-1">
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Gain/Loss</p>
            <MoneyValue value={totalGainLoss} compact className={cn("mt-1 text-base font-semibold sm:hidden", totalGainLoss >= 0 ? "text-emerald-500" : "text-rose-500")} />
            <MoneyValue value={totalGainLoss} className={cn("mt-1 hidden text-xl font-semibold sm:inline", totalGainLoss >= 0 ? "text-emerald-500" : "text-rose-500")} />
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
                  <div className="hidden w-full flex-col gap-2 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <MoneyValue value={item.currentValue} className="text-sm font-semibold" />
                    <Button
                      variant={item.status === "closed" ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => toggleStatus(item)}
                      disabled={isPending}
                      aria-label={`Toggle status for ${item.name}`}
                      title={item.status === "closed" ? "Mark as active" : "Mark as closed"}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" aria-label={`Open actions for ${item.name}`}>
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-56 p-2">
                        <div className="grid gap-1">
                          <Button variant="outline" className="justify-start" onClick={() => onEdit(item)} disabled={isPending}>
                            <Pencil className="h-4 w-4" />
                            Edit investment
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => toggleStatus(item)}
                            disabled={isPending}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {item.status === "closed" ? "Mark as active" : "Mark as closed"}
                          </Button>
                          <Button variant="outline" className="justify-start border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingItem(item)} disabled={isPending}>
                            <Trash2 className="h-4 w-4" />
                            Delete investment
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
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
                <div className="flex items-center justify-between border-t border-border/70 pt-3 sm:hidden">
                  <span className="text-xs text-muted-foreground">{formatStatusLabel(item.status)}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={item.status === "closed" ? "secondary" : "outline"}
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
            <SheetTitle>Investment actions</SheetTitle>
            <SheetDescription>
              {selectedItem ? selectedItem.name : "Choose what to do with this investment."}
            </SheetDescription>
          </SheetHeader>
          {selectedItem ? (
            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">{selectedItem.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedItem.type}{selectedItem.platform ? ` · ${selectedItem.platform}` : ""}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current value</span>
                  <MoneyValue value={selectedItem.currentValue} className="font-semibold" />
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
                  {selectedItem.status === "closed" ? "Activate" : "Close"}
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
