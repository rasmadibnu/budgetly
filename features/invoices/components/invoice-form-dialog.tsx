"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { AmountInput } from "@/components/ui/amount-input";
import { Button } from "@/components/ui/button";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createInvoice, updateInvoice } from "@/features/invoices/server/actions";
import { invoiceSchema, type InvoiceInput } from "@/features/invoices/schemas/invoice-schema";

const defaults: InvoiceInput = {
  name: "",
  clientName: "",
  amount: 0,
  issuedDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date().toISOString().slice(0, 10),
  status: "unpaid",
  notes: ""
};

export function InvoiceFormDialog({
  open,
  onOpenChange,
  onSuccess,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: InvoiceInput;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaults
  });

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().slice(0, 10);
      form.reset(initialData ?? { ...defaults, issuedDate: today, dueDate: today });
    }
  }, [open, form, initialData]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (values.id) {
          await updateInvoice(values);
        } else {
          await createInvoice(values);
        }
        toast.success(values.id ? "Invoice updated" : "Invoice created");
        onOpenChange(false);
        onSuccess();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save invoice");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Edit invoice" : "Create invoice"}</DialogTitle>
          <DialogDescription>Create and maintain invoices issued to your clients.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <input type="hidden" {...form.register("id")} />
          <div className="space-y-1.5">
            <Label>Invoice title</Label>
            <Input {...form.register("name")} placeholder="Website development invoice" />
          </div>
          <div className="space-y-1.5">
            <Label>Client name</Label>
            <Input {...form.register("clientName")} placeholder="PT Example Client" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <AmountInput value={form.watch("amount")} onValueChange={(value) => form.setValue("amount", value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Issued date</Label>
              <DatePickerField value={form.watch("issuedDate")} onChange={(value) => form.setValue("issuedDate", value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <DatePickerField value={form.watch("dueDate")} onChange={(value) => form.setValue("dueDate", value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value as InvoiceInput["status"])}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Payment terms, project phase, or invoice note" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : initialData?.id ? "Update invoice" : "Save invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
