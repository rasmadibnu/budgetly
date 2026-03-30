"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, CircleDashed, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { MoneyValue } from "@/components/ui/money-value";
import { EmptyState } from "@/components/feedback/empty-state";
import { SubscriptionFormDialog } from "@/features/subscriptions/components/subscription-form-dialog";
import { deleteSubscription, setSubscriptionCycleStatus } from "@/features/subscriptions/server/actions";
import type { SubscriptionInput } from "@/features/subscriptions/schemas/subscription-schema";
import type { CategoryOption, SubscriptionItem } from "@/types/app";
import { formatDate } from "@/utils/format";

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
        toast.success(`Subscription marked ${status}`);
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Subscriptions"
        title="🔁 Recurring services with monthly payable state"
        description="Each active subscription generates a monthly expense cycle that can stay unpaid or be marked paid."
        actions={<Button onClick={() => { setEditingItem(undefined); setDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" />Add subscription</Button>}
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Monthly subscription cost</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={totalMonthlyCost} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Paid this month</p>
            <p className="mt-1 text-xl font-semibold">{paidCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">{initialItems.length} active cycle(s) tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Unpaid exposure</p>
            <div className="mt-1 text-xl font-semibold"><MoneyValue value={unpaidMonthlyCost} /></div>
            <p className="mt-1 text-xs text-muted-foreground">{unpaidCount} unpaid / overdue cycle(s)</p>
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
                      <Badge variant={item.status === "active" ? "success" : "secondary"}>{item.status}</Badge>
                      <Badge variant={item.cycle.status === "paid" ? "success" : item.cycle.status === "overdue" ? "danger" : "outline"}>
                        {item.cycle.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      {item.vendor} · Due {formatDate(item.cycle.dueDate)} · Billing day {item.billingDay}
                    </p>
                    {item.notes ? <p className="mt-1 text-[12px] text-muted-foreground">{item.notes}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(item)} disabled={isPending}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                    <Button variant={item.cycle.status === "paid" ? "secondary" : "outline"} size="sm" onClick={() => setStatus(item.id, "paid")} disabled={item.status !== "active" || item.cycle.status === "paid" || isPending}><CheckCircle2 className="mr-2 h-4 w-4" />Paid</Button>
                    <Button variant={item.cycle.status === "unpaid" || item.cycle.status === "overdue" ? "secondary" : "outline"} size="sm" onClick={() => setStatus(item.id, "unpaid")} disabled={item.status !== "active" || (item.cycle.status !== "paid" && item.cycle.linkedTransactionId === null) || isPending}><CircleDashed className="mr-2 h-4 w-4" />Unpaid</Button>
                    <Button variant="outline" size="sm" onClick={() => setDeletingItem(item)} disabled={isPending}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                  </div>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-3">
                  <div><p className="text-muted-foreground">Amount</p><MoneyValue value={item.amount} className="font-semibold" /></div>
                  <div><p className="text-muted-foreground">Month</p><p className="font-semibold">{month}</p></div>
                  <div><p className="text-muted-foreground">Transaction sync</p><p className="font-semibold">{item.cycle.linkedTransactionId ? "Created" : "Not created"}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
