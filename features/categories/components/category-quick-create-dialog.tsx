"use client";

import { useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { upsertCategory } from "@/features/categories/server/actions";
import { categorySchema, type CategoryInput } from "@/features/categories/schemas/category-schema";
import type { CategoryOption } from "@/types/app";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESETS = ["#22c55e", "#10b981", "#14b8a6", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"] as const;

export function CategoryQuickCreateDialog({
  open,
  onOpenChange,
  type,
  onCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "income" | "expense";
  onCreated: (category: CategoryOption) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type,
      color: type === "income" ? "#22c55e" : "#0ea5e9",
      reportGroup: "secondary"
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        type,
        color: type === "income" ? "#22c55e" : "#0ea5e9",
        reportGroup: "secondary"
      });
    }
  }, [form, open, type]);

  const submit = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const created = await upsertCategory({ ...values, type });
        toast.success("Category created");
        onCreated(created);
        onOpenChange(false);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create category");
      }
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
          <DialogDescription>Create a new {type} category without leaving this form.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...form.register("name")} placeholder={type === "income" ? "Salary" : "Groceries"} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-8 w-8 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  onClick={() => form.setValue("color", color, { shouldDirty: true, shouldValidate: true })}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Input {...form.register("color")} placeholder="#0ea5e9" />
              <span className="h-9 w-9 shrink-0 rounded-full border border-border" style={{ backgroundColor: form.watch("color") || "#0ea5e9" }} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
