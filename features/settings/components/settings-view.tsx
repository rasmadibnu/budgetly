"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Download, FileArchive, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { deleteCategory, upsertCategory } from "@/features/categories/server/actions";
import { categorySchema, type CategoryInput } from "@/features/categories/schemas/category-schema";
import { exportBackupAction, generateMonthlyReportAction } from "@/features/settings/server/actions";
import type { CategoryOption, UserProfile } from "@/types/app";

export function SettingsView({ user, categories }: { user: UserProfile; categories: CategoryOption[] }) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      color: "#0f766e"
    }
  });

  const resetCategoryForm = () => {
    setEditingId(null);
    form.reset({
      name: "",
      type: "expense",
      color: "#0f766e",
      icon: undefined
    });
  };

  const submit = form.handleSubmit((values) => {
    const optimisticId = values.id ?? crypto.randomUUID();
    const optimistic = {
      id: optimisticId,
      name: values.name,
      type: values.type,
      color: values.color
    };
    const previous = localCategories;
    setLocalCategories((current) =>
      values.id ? current.map((item) => (item.id === values.id ? optimistic : item)) : [optimistic, ...current]
    );
    startTransition(async () => {
      try {
        await upsertCategory(values);
        toast.success(values.id ? "Category updated" : "Category created");
        resetCategoryForm();
      } catch (error) {
        setLocalCategories(previous);
        toast.error(error instanceof Error ? error.message : "Unable to save category");
      }
    });
  });

  const startEdit = (category: CategoryOption) => {
    setEditingId(category.id);
    form.reset({
      id: category.id,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: undefined
    });
  };

  const onDeleteCategory = (category: CategoryOption) => {
    const previous = localCategories;
    setLocalCategories((current) => current.filter((item) => item.id !== category.id));
    startTransition(async () => {
      try {
        await deleteCategory(category.id);
        if (editingId === category.id) {
          resetCategoryForm();
        }
        toast.success("Category deleted");
      } catch (error) {
        setLocalCategories(previous);
        toast.error(error instanceof Error ? error.message : "Unable to delete category");
      }
    });
  };

  const exportBackup = () => {
    startTransition(async () => {
      const payload = await exportBackupAction();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `budgetly-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Backup exported");
    });
  };

  const generateReport = () => {
    startTransition(async () => {
      await generateMonthlyReportAction();
      toast.success("Monthly report generated");
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Settings" title="Household preferences and utilities" description="Manage profile, categories, reporting, and backup actions from one place." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Authenticated Budgetly household member.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-semibold">{user.email}</p>
            <Badge>{user.role}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>Generate a month-end rollup to keep historical snapshots.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={generateReport} disabled={isPending}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate report
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Backup</CardTitle>
            <CardDescription>Export a household-wide JSON snapshot for recovery.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" onClick={exportBackup} disabled={isPending}>
              <FileArchive className="mr-2 h-4 w-4" />
              Export backup
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit category" : "Category master data"}</CardTitle>
            <CardDescription>Maintain reusable categories used by transactions, budgets, reports, and charts.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <input type="hidden" {...form.register("id")} />
              <div className="space-y-2"><Label>Name</Label><Input {...form.register("name")} /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value as "income" | "expense")}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Color</Label><Input {...form.register("color")} /></div>
              <div className="flex gap-3">
                <Button className="flex-1" type="submit" disabled={isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Update category" : "Save category"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetCategoryForm}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Category list</CardTitle>
              <CardDescription>Master data for all household income and expense classifications.</CardDescription>
            </div>
            <Download className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {localCategories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.type}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{category.type}</Badge>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => startEdit(category)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => onDeleteCategory(category)} disabled={isPending}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
                <div className="mt-3 rounded-xl bg-muted/45 px-3 py-2 text-xs text-muted-foreground">
                  Used as master data across transaction forms, budgets, and reports.
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
