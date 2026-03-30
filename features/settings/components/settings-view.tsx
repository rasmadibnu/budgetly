"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Download, FileArchive, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCategory, upsertCategory } from "@/features/categories/server/actions";
import { categorySchema, type CategoryInput } from "@/features/categories/schemas/category-schema";
import { exportBackupAction, generateMonthlyReportAction } from "@/features/settings/server/actions";
import type { CategoryOption, UserProfile } from "@/types/app";
import { cn } from "@/utils/cn";

const CATEGORY_COLOR_PRESETS = [
  { name: "Slate", value: "#64748b", className: "bg-slate-500" },
  { name: "Gray", value: "#6b7280", className: "bg-gray-500" },
  { name: "Red", value: "#ef4444", className: "bg-red-500" },
  { name: "Orange", value: "#f97316", className: "bg-orange-500" },
  { name: "Amber", value: "#f59e0b", className: "bg-amber-500" },
  { name: "Yellow", value: "#eab308", className: "bg-yellow-500" },
  { name: "Lime", value: "#84cc16", className: "bg-lime-500" },
  { name: "Green", value: "#22c55e", className: "bg-green-500" },
  { name: "Emerald", value: "#10b981", className: "bg-emerald-500" },
  { name: "Teal", value: "#14b8a6", className: "bg-teal-500" },
  { name: "Cyan", value: "#06b6d4", className: "bg-cyan-500" },
  { name: "Sky", value: "#0ea5e9", className: "bg-sky-500" },
  { name: "Blue", value: "#3b82f6", className: "bg-blue-500" },
  { name: "Indigo", value: "#6366f1", className: "bg-indigo-500" },
  { name: "Violet", value: "#8b5cf6", className: "bg-violet-500" },
  { name: "Pink", value: "#ec4899", className: "bg-pink-500" }
] as const;

export function SettingsView({ user, categories }: { user: UserProfile; categories: CategoryOption[] }) {
  const [localCategories, setLocalCategories] = useState(categories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<CategoryOption | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
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
    setCategoryDialogOpen(false);
    form.reset({
      name: "",
      type: "expense",
      color: "#0f766e",
      icon: undefined
    });
  };

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

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
        router.refresh();
      } catch (error) {
        setLocalCategories(previous);
        toast.error(error instanceof Error ? error.message : "Unable to save category");
      }
    });
  });

  const startEdit = (category: CategoryOption) => {
    setEditingId(category.id);
    setCategoryDialogOpen(true);
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

  const startCreate = () => {
    setEditingId(null);
    form.reset({
      name: "",
      type: "expense",
      color: "#0f766e",
      icon: undefined
    });
    setCategoryDialogOpen(true);
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
      <PageHeader eyebrow="Settings" title="⚙️ Household preferences and utilities" description="Manage profile, categories, reporting, and backup actions from one place." />
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
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Category list</CardTitle>
              <CardDescription>Master data for all household income and expense classifications.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={startCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Add category
              </Button>
              <Button type="button" variant="outline" onClick={exportBackup} disabled={isPending}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="space-y-3 p-4 md:hidden">
                {localCategories.map((category) => (
                  <div key={category.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">Used across forms, budgets, and reports</p>
                        </div>
                      </div>
                      <Badge variant="outline">{category.type}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: category.color }} />
                      <span className="font-mono text-xs text-muted-foreground">{category.color}</span>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => startEdit(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setDeletingCategory(category)} disabled={isPending}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead className="w-[180px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-xs text-muted-foreground">Used across forms, budgets, and reports</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: category.color }} />
                            <span className="font-mono text-xs text-muted-foreground">{category.color}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => startEdit(category)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => setDeletingCategory(category)} disabled={isPending}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={categoryDialogOpen} onOpenChange={(open) => (!open ? resetCategoryForm() : setCategoryDialogOpen(true))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit category" : "Add category"}</DialogTitle>
            <DialogDescription>Manage category master data used across transactions, budgets, reports, and charts.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <input type="hidden" {...form.register("id")} />
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Example: Groceries" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value as "income" | "expense")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Color palette</Label>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {CATEGORY_COLOR_PRESETS.map((preset) => {
                  const selected = form.watch("color") === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      title={preset.name}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-2xl border transition",
                        selected ? "border-foreground ring-2 ring-primary/20" : "border-border hover:border-foreground/30"
                      )}
                      onClick={() => form.setValue("color", preset.value, { shouldDirty: true, shouldValidate: true })}
                    >
                      <span className={cn("h-6 w-6 rounded-full", preset.className)} />
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-color">Custom hex color</Label>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-border bg-muted/20 p-3">
                    <HexColorPicker
                      color={form.watch("color") || "#0f766e"}
                      onChange={(value) => form.setValue("color", value, { shouldDirty: true, shouldValidate: true })}
                      className="!h-[180px] !w-full"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Input id="category-color" {...form.register("color")} placeholder="#0f766e" />
                    <span
                      className="h-10 w-10 shrink-0 rounded-2xl border border-border"
                      style={{ backgroundColor: form.watch("color") || "#0f766e" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetCategoryForm}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {editingId ? "Update category" : "Save category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete category?"
        description={deletingCategory ? `This will permanently remove "${deletingCategory.name}" if it is not used by budgets or transactions.` : "This category will be removed permanently."}
        isPending={isPending}
        onConfirm={() => deletingCategory && onDeleteCategory(deletingCategory)}
      />
    </div>
  );
}
