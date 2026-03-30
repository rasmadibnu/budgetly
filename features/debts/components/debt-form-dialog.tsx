"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createDebtReceivable, updateDebtReceivable } from "@/features/debts/server/actions";
import { debtSchema, type DebtInput } from "@/features/debts/schemas/debt-schema";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const defaults: DebtInput = {
  direction: "debt",
  name: "",
  counterparty: "",
  totalAmount: 0,
  paidAmount: 0,
  dueDate: "",
  status: "open",
  notes: ""
};

export function DebtFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: DebtInput;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<DebtInput>({
    resolver: zodResolver(debtSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (open) form.reset(initialData ?? defaults);
  }, [form, initialData, open]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (values.id) {
          await updateDebtReceivable(values);
        } else {
          await createDebtReceivable(values);
        }
        toast.success(values.id ? "Record updated" : "Record created");
        onOpenChange(false);
        onSuccess();
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save record");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit record" : "Add debt or receivable"}</DialogTitle>
          <DialogDescription>Track money you owe and money clients or family still owe you.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <input type="hidden" {...form.register("id")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.watch("direction")} onValueChange={(value) => form.setValue("direction", value as DebtInput["direction"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debt">Debt</SelectItem>
                  <SelectItem value="receivable">Receivable</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as DebtInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input {...form.register("name")} placeholder="Family loan or project receivable" />
          </div>
          <div className="space-y-1.5">
            <Label>Counterparty</Label>
            <Input {...form.register("counterparty")} placeholder="BCA Finance or PT Example Client" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Total amount</Label>
              <AmountInput value={form.watch("totalAmount")} onValueChange={(value) => form.setValue("totalAmount", value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Paid amount</Label>
              <AmountInput value={form.watch("paidAmount")} onValueChange={(value) => form.setValue("paidAmount", value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <DatePickerField value={form.watch("dueDate") || ""} onChange={(value) => form.setValue("dueDate", value)} placeholder="Optional due date" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Installment notes, invoice milestone, or payment memo" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
