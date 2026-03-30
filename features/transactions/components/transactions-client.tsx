"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoneyValue } from "@/components/ui/money-value";
import { deleteTransaction } from "@/features/transactions/server/actions";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import type { CategoryOption, TransactionListItem, UserProfile } from "@/types/app";
import { formatDate } from "@/utils/format";

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
  const [isPending, startTransition] = useTransition();

  const filteredRows = useMemo(
    () => rows.filter((row) => `${row.category} ${row.description ?? ""} ${row.userName}`.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const pageSize = 8;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));

  const exportCsv = async () => {
    const headers = ["Date,User,Type,Category,Description,Amount"];
    const lines = filteredRows.map((row) =>
      [row.date, row.userName, row.type, row.category, row.description ?? "", row.amount].join(",")
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
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions" className="pl-10" />
            </div>
            <Badge variant="secondary">{filteredRows.length} records</Badge>
          </div>
          {!paginatedRows.length ? (
            <EmptyState title="No transactions yet" description="Create the first household transaction to start tracking cash flow." actionLabel="Add transaction" onAction={() => setDialogOpen(true)} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
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
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell>{row.userName}</TableCell>
                        <TableCell><Badge variant="outline">{row.category}</Badge></TableCell>
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
                            <Button variant="ghost" size="icon" disabled={isPending} onClick={() => onDelete(row.id)}>
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

      <TransactionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} categories={categories} users={users} initialData={editing} />
    </div>
  );
}
