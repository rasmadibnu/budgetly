"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleDashed, Ellipsis, Pencil, Plus, Trash2 } from "lucide-react";
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
import { SubscriptionFormDialog } from "@/features/subscriptions/components/subscription-form-dialog";
import { deleteSubscription, setSubscriptionCycleStatus } from "@/features/subscriptions/server/actions";
import type { SubscriptionInput } from "@/features/subscriptions/schemas/subscription-schema";
import type { CategoryOption, SubscriptionItem } from "@/types/app";
import { formatDate, formatStatusLabel } from "@/utils/format";

export function SubscriptionsClient({
  initialItems,
  categories,
  month
}: {
  initialItems: SubscriptionItem[];
  categories: CategoryOption[];
  month: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SubscriptionInput | undefined>();
  const [deletingItem, setDeletingItem] = useState<SubscriptionItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<SubscriptionItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const onEdit = (item: SubscriptionItem) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      vendor: item.vendor,
      amount: item.amount,
      billingDay: item.billingDay,
      categoryId: item.categoryId ?? "",
      paymentMethod: item.paymentMethod ?? "",
      startDate: item.startDate,
      status: item.status,
      notes: item.notes ?? ""
    });
    setDialogOpen(true);
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteSubscription(id);
        toast.success("Subscription deleted");
        router.refresh();
      } catch {
        toast.error("Unable to delete subscription");
      }
    });
  };

  const setStatus = (subscriptionId: string, status: "paid" | "unpaid") => {
    startTransition(async () => {
      try {
        await setSubscriptionCycleStatus(subscriptionId, month, status);
        toast.success(`Subscription marked ${formatStatusLabel(status)}`);
        router.refresh();
      } catch {
        toast.error("Unable to update payment status");
      }
    });
  };

  const paidCount = initialItems.filter((item) => item.cycle.status === "paid").length;
  const unpaidCount = initialItems.filter((item) => item.cycle.status !== "paid").length;
  const totalMonthlyCost = initialItems.reduce((sum, item) => sum + item.amount, 0);
  const unpaidMonthlyCost = initialItems
    .filter((item) => item.cycle.status !== "paid")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Subscriptions"
        title="🔁 Recurring services with monthly payable state"
        description="Each active subscription generates a monthly expense cycle that can stay unpaid or be marked paid."
        actions={<Button className="shrink-0 md:h-9 md:px-4 md:py-2" size="icon" onClick={() => { setEditingItem(undefined); setDialogOpen(true); }} aria-label="Add subscription" title="Add subscription"><Plus className="h-4 w-4 md:mr-2" /><span className="sr-only md:not-sr-only">Add subscription</span></Button>}
      />
      <SubscriptionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => router.refresh()} initialData={editingItem} categories={categories} />
      <ConfirmDialog
        open={Boolean(deletingItem)}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete subscription?"
        description={deletingItem ? `This will permanently remove "${deletingItem.name}" and its generated transaction links.` : "This subscription will be removed permanently."}
        isPending={isPending}
        onConfirm={() => deletingItem && onDelete(deletingItem.id)}
      />
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3">
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Monthly</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={totalMonthlyCost} compact className="sm:hidden" /><MoneyValue value={totalMonthlyCost} className="hidden sm:inline" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Paid</p>
            <p className="mt-1 text-base font-semibold sm:text-xl">{paidCount}</p>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{initialItems.length} active</p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 md:col-span-1">
          <CardContent className="p-3 sm:p-5">
            <p className="text-xs text-muted-foreground sm:text-sm">Unpaid</p>
            <div className="mt-1 text-base font-semibold sm:text-xl"><MoneyValue value={unpaidMonthlyCost} compact className="sm:hidden" /><MoneyValue value={unpaidMonthlyCost} className="hidden sm:inline" /></div>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{unpaidCount} cycle(s)</p>
          </CardContent>
        </Card>
      </div>
      {!initialItems.length ? (
        <EmptyState title="No subscriptions yet" description="Add recurring services so each month automatically gets a payable expense record." />
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
                      <Badge variant={item.cycle.status === "paid" ? "success" : item.cycle.status === "overdue" ? "danger" : "outline"}>
                        {formatStatusLabel(item.cycle.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {item.vendor} · Due {formatDate(item.cycle.dueDate)} · Billing day {item.billingDay}
                    </p>
                    {item.notes ? <p className="mt-1 text-[12px] text-muted-foreground">{item.notes}</p> : null}
                  </div>
                  <div className="hidden w-full flex-col gap-2 sm:flex sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    <MoneyValue value={item.amount} className="text-sm font-semibold" />
                    <Button
                      variant={item.cycle.status === "paid" ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => setStatus(item.id, item.cycle.status === "paid" ? "unpaid" : "paid")}
                      disabled={item.status !== "active" || isPending}
                      aria-label={`Mark ${item.name} as paid`}
                      title={item.cycle.status === "paid" ? "Mark as unpaid" : "Mark as paid"}
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
                            Edit subscription
                          </Button>
                          <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => setStatus(item.id, item.cycle.status === "paid" ? "unpaid" : "paid")}
                            disabled={item.status !== "active" || isPending}
                          >
                            {item.cycle.status === "paid" ? <CircleDashed className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            {item.cycle.status === "paid" ? "Mark as unpaid" : "Mark as paid"}
                          </Button>
                          <Button variant="outline" className="justify-start border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeletingItem(item)} disabled={isPending}>
                            <Trash2 className="h-4 w-4" />
                            Delete subscription
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-muted-foreground">Amount</p><MoneyValue value={item.amount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Month</p><p className="font-semibold">{month}</p></div>
                  <div><p className="text-muted-foreground">Transaction sync</p><p className="font-semibold">{item.cycle.linkedTransactionId ? "Created" : "Not created"}</p></div>
                </div>
                <div className="flex items-center justify-between border-t border-border/70 pt-3 sm:hidden">
                  <MoneyValue value={item.amount} className="text-sm font-semibold" />
                  <div className="flex items-center gap-2">
                    <Button
                      variant={item.cycle.status === "paid" ? "secondary" : "outline"}
                      size="icon"
                      onClick={() => setStatus(item.id, item.cycle.status === "paid" ? "unpaid" : "paid")}
                      disabled={item.status !== "active" || isPending}
                      aria-label={`Toggle paid status for ${item.name}`}
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
            <SheetTitle>Subscription actions</SheetTitle>
            <SheetDescription>
              {selectedItem ? selectedItem.name : "Choose what to do with this subscription."}
            </SheetDescription>
          </SheetHeader>
          {selectedItem ? (
            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium">{selectedItem.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{selectedItem.vendor}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <MoneyValue value={selectedItem.amount} className="font-semibold" />
                </div>
              </div>
              <div className="grid gap-2">
                <Button variant="outline" className="justify-start" onClick={() => { onEdit(selectedItem); setSelectedItem(null); }}>
                  <Pencil className="h-4 w-4" />
                  Edit subscription
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => { setStatus(selectedItem.id, "paid"); setSelectedItem(null); }}
                  disabled={selectedItem.status !== "active" || selectedItem.cycle.status === "paid" || isPending}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark as paid
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() => { setStatus(selectedItem.id, "unpaid"); setSelectedItem(null); }}
                  disabled={selectedItem.status !== "active" || (selectedItem.cycle.status !== "paid" && selectedItem.cycle.linkedTransactionId === null) || isPending}
                >
                  <CircleDashed className="h-4 w-4" />
                  Mark as unpaid
                </Button>
                <Button variant="outline" className="justify-start border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => { setDeletingItem(selectedItem); setSelectedItem(null); }} disabled={isPending}>
                  <Trash2 className="h-4 w-4" />
                  Delete subscription
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
