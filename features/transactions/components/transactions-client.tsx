"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoneyValue } from "@/components/ui/money-value";
import { deleteTransaction } from "@/features/transactions/server/actions";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import type { CategoryOption, TransactionListItem, UserProfile } from "@/types/app";
import { formatDateTime } from "@/utils/format";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  if ([red, green, blue].some((part) => Number.isNaN(part))) {
    return undefined;
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function TransactionsClient({
  initialRows,
  summary,
  categories,
  users,
  initialMonth
}: {
  initialRows: TransactionListItem[];
  summary: { income: number; expense: number; net: number };
  categories: CategoryOption[];
  users: UserProfile[];
  initialMonth: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<(TransactionListItem & { categoryId?: string | null }) | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const filteredRows = useMemo(
    () => rows.filter((row) => `${row.category} ${row.description ?? ""} ${row.userName}`.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  const categoryColors = useMemo(() => new Map(categories.map((category) => [category.id, category.color])), [categories]);

  const pageSize = 8;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const exportCsv = async () => {
    const headers = ["Date,User,Type,Category,Description,Amount"];
    const lines = filteredRows.map((row) =>
      [row.createdAt, row.userName, row.type, row.category, row.description ?? "", row.amount].join(",")
    );
    const blob = new Blob([[...headers, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `budgetly-transactions-${initialMonth}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const onDelete = (id: string) => {
    const previous = rows;
    setRows((current) => current.filter((row) => row.id !== id));
    startTransition(async () => {
      try {
        await deleteTransaction(id);
        toast.success("Transaction deleted");
      } catch (error) {
        setRows(previous);
        toast.error(error instanceof Error ? error.message : "Failed to delete transaction");
      }
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Transactions"
        title="💸 Every rupiah, organized"
        description="Searchable household ledger with export, receipt links, and recurring support."
        actions={
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add transaction
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Monthly income</p><div className="mt-2 text-2xl font-semibold"><MoneyValue value={summary.income} /></div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Monthly expense</p><div className="mt-2 text-2xl font-semibold"><MoneyValue value={summary.expense} /></div></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Net flow</p><div className="mt-2 text-2xl font-semibold"><MoneyValue value={summary.net} /></div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions" className="pl-10" />
            </div>
            <Badge variant="secondary">{filteredRows.length} records</Badge>
          </div>
          {!paginatedRows.length ? (
            <EmptyState title="No transactions yet" description="Create the first household transaction to start tracking cash flow." actionLabel="Add transaction" onAction={() => setDialogOpen(true)} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-3 md:hidden">
                {paginatedRows.map((row) => (
                  <div key={row.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{row.userName}</p>
                        <Badge
                          variant="outline"
                          className="border-transparent"
                          style={{
                            backgroundColor: row.categoryId ? hexToRgba(categoryColors.get(row.categoryId) ?? "", 0.14) : undefined,
                            color: row.categoryId ? categoryColors.get(row.categoryId) ?? undefined : undefined
                          }}
                        >
                          <span
                            className="mr-1.5 h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: row.categoryId ? categoryColors.get(row.categoryId) ?? "#94a3b8" : "#94a3b8" }}
                          />
                          {row.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</p>
                        <MoneyValue value={row.amount} className={row.type === "income" ? "mt-1 font-semibold text-success" : "mt-1 font-semibold"} />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{row.description ?? "No description"}</p>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(row);
                          setDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="ghost" size="icon" disabled={isPending} onClick={() => setDeletingId(row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                        <TableCell>{row.userName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-transparent"
                            style={{
                              backgroundColor: row.categoryId ? hexToRgba(categoryColors.get(row.categoryId) ?? "", 0.14) : undefined,
                              color: row.categoryId ? categoryColors.get(row.categoryId) ?? undefined : undefined
                            }}
                          >
                            <span
                              className="mr-1.5 h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: row.categoryId ? categoryColors.get(row.categoryId) ?? "#94a3b8" : "#94a3b8" }}
                            />
                            {row.category}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.description ?? "No description"}</TableCell>
                        <TableCell className={row.type === "income" ? "text-success" : ""}><MoneyValue value={row.amount} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditing(row);
                                setDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button variant="ghost" size="icon" disabled={isPending} onClick={() => setDeletingId(row.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories}
        users={users}
        initialData={editing}
        onSuccess={() => {
          setEditing(undefined);
          setPage(1);
        }}
      />
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete transaction?"
        description="This transaction will be removed permanently."
        isPending={isPending}
        onConfirm={() => deletingId && onDelete(deletingId)}
      />
    </div>
  );
}
