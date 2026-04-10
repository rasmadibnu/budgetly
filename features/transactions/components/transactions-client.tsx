"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { CalendarRange, Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { EmptyState } from "@/components/feedback/empty-state";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoneyValue } from "@/components/ui/money-value";
import { deleteTransaction } from "@/features/transactions/server/actions";
import { TransactionFormDialog } from "@/features/transactions/components/transaction-form-dialog";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { useMobile } from "@/hooks/use-mobile";
import type { CategoryOption, TransactionListItem, UserProfile } from "@/types/app";
import { formatDate, formatDateTime } from "@/utils/format";

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

function DateRangeFilterPanel({
  fromDate,
  toDate,
  isPending,
  onFromDateChange,
  onToDateChange,
  onClear,
  onApply
}: {
  fromDate: string;
  toDate: string;
  isPending: boolean;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">From</p>
          <DatePickerField value={fromDate || undefined} onChange={onFromDateChange} placeholder="Start date" id="transactions-from-date" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">To</p>
          <DatePickerField value={toDate || undefined} onChange={onToDateChange} placeholder="End date" id="transactions-to-date" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClear} disabled={isPending || (!fromDate && !toDate)}>
          Clear
        </Button>
        <Button type="button" className="flex-1" onClick={onApply} disabled={isPending || (!fromDate && !toDate)}>
          Apply range
        </Button>
      </div>
    </div>
  );
}

export function TransactionsClient({
  initialRows,
  summary,
  categories,
  users,
  initialMonth,
  initialFrom,
  initialTo
}: {
  initialRows: TransactionListItem[];
  summary: { income: number; expense: number; net: number };
  categories: CategoryOption[];
  users: UserProfile[];
  initialMonth: string;
  initialFrom?: string | null;
  initialTo?: string | null;
}) {
  const [rows, setRows] = useState(initialRows);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<(TransactionListItem & { categoryId?: string | null }) | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TransactionListItem | null>(null);
  const [fromDate, setFromDate] = useState(initialFrom ?? "");
  const [toDate, setToDate] = useState(initialTo ?? "");
  const [filterOpen, setFilterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useMobile();

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    setFromDate(initialFrom ?? "");
  }, [initialFrom]);

  useEffect(() => {
    setToDate(initialTo ?? "");
  }, [initialTo]);

  useEffect(() => {
    setPage(1);
  }, [search, initialRows, fromDate, toDate]);

  const filteredRows = useMemo(
    () => rows.filter((row) => `${row.category} ${row.description ?? ""} ${row.userName}`.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );
  const categoryColors = useMemo(() => new Map(categories.map((category) => [category.id, category.color])), [categories]);

  const pageSize = 8;
  const paginatedRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const hasActiveRange = Boolean(fromDate || toDate);

  const activeRangeLabel = useMemo(() => {
    if (fromDate && toDate) return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
    if (fromDate) return `From ${formatDate(fromDate)}`;
    if (toDate) return `Until ${formatDate(toDate)}`;
    return `Month ${initialMonth}`;
  }, [fromDate, toDate, initialMonth]);

  const applyDateRange = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (fromDate) {
      params.set("from", fromDate);
    } else {
      params.delete("from");
    }

    if (toDate) {
      params.set("to", toDate);
    } else {
      params.delete("to");
    }

    setFilterOpen(false);
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  const clearDateRange = () => {
    setFromDate("");
    setToDate("");
    setFilterOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("from");
    params.delete("to");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  };

  const exportCsv = async () => {
    const headers = ["Date,User,Type,Category,Description,Amount"];
    const lines = filteredRows.map((row) =>
      [row.createdAt, row.userName, row.type, row.category, row.description ?? "", row.amount].join(",")
    );
    const blob = new Blob([[...headers, ...lines].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `budgetly-transactions-${fromDate || toDate ? "range" : initialMonth}.csv`);
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

  const filterTrigger = (
    <Button type="button" variant="outline" className="w-full justify-between md:w-auto" onClick={() => setFilterOpen(true)}>
      <span className="inline-flex items-center gap-2 truncate">
        <CalendarRange className="h-4 w-4" />
        <span className="truncate">{hasActiveRange ? activeRangeLabel : "Filter dates"}</span>
      </span>
      {hasActiveRange ? <Badge variant="secondary" className="ml-2">Active</Badge> : null}
    </Button>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Transactions"
        title="💸 Every rupiah, organized"
        description="Searchable household ledger with export, receipt links, and recurring support."
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-3">
        <Card><CardContent className="p-3 sm:p-5"><p className="text-xs text-muted-foreground sm:text-sm">Income</p><div className="mt-1 text-base font-semibold sm:mt-2 sm:text-2xl"><MoneyValue value={summary.income} compact className="sm:hidden" /><MoneyValue value={summary.income} className="hidden sm:inline" /></div></CardContent></Card>
        <Card><CardContent className="p-3 sm:p-5"><p className="text-xs text-muted-foreground sm:text-sm">Expense</p><div className="mt-1 text-base font-semibold sm:mt-2 sm:text-2xl"><MoneyValue value={summary.expense} compact className="sm:hidden" /><MoneyValue value={summary.expense} className="hidden sm:inline" /></div></CardContent></Card>
        <Card><CardContent className="p-3 sm:p-5"><p className="text-xs text-muted-foreground sm:text-sm">Net</p><div className="mt-1 text-base font-semibold sm:mt-2 sm:text-2xl"><MoneyValue value={summary.net} compact className="sm:hidden" /><MoneyValue value={summary.net} className="hidden sm:inline" /></div></CardContent></Card>
      </div>

      <Card className="border-0 bg-transparent shadow-none md:rounded-xl md:border md:bg-card md:shadow-none">
        <CardContent className="px-0 pb-0 pt-0 md:p-6">
          <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
            <div className="relative min-w-0 md:w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions" className="pl-10" />
            </div>

            {isMobile ? (
              filterTrigger
            ) : (
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  {filterTrigger}
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[340px] p-4">
                  <div className="mb-3 space-y-1">
                    <p className="text-sm font-semibold">Filter by date range</p>
                    <p className="text-xs text-muted-foreground">Choose a start and end date to narrow the transaction list.</p>
                  </div>
                  <DateRangeFilterPanel
                    fromDate={fromDate}
                    toDate={toDate}
                    isPending={isPending}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                    onClear={clearDateRange}
                    onApply={applyDateRange}
                  />
                </PopoverContent>
              </Popover>
            )}

            <div className="flex min-w-0 justify-end gap-2 md:w-auto">
              <Button
                onClick={() => {
                  setEditing(undefined);
                  setDialogOpen(true);
                }}
                size="icon"
                className="shrink-0 md:h-9 md:w-auto md:px-4 md:py-2"
                aria-label="Add transaction"
                title="Add transaction"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="sr-only md:not-sr-only">Add transaction</span>
              </Button>
              <Button
                variant="outline"
                onClick={exportCsv}
                size="icon"
                className="shrink-0 md:h-9 md:w-auto md:px-4 md:py-2"
                aria-label="Export CSV"
                title="Export CSV"
              >
                <Download className="h-4 w-4 md:mr-2" />
                <span className="sr-only md:not-sr-only">Export CSV</span>
              </Button>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{activeRangeLabel}</Badge>
            {hasActiveRange ? (
              <p className="text-xs text-muted-foreground">Totals and records below are using this selected date range.</p>
            ) : (
              <p className="text-xs text-muted-foreground">No custom date range selected, showing the active month.</p>
            )}
          </div>

          {!paginatedRows.length ? (
            <EmptyState title="No transactions yet" description="Create the first household transaction to start tracking cash flow." actionLabel="Add transaction" onAction={() => setDialogOpen(true)} />
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-3 md:hidden">
                {paginatedRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    className="w-full rounded-2xl border border-border p-4 text-left transition hover:border-foreground/15 hover:bg-muted/20"
                    onClick={() => setSelectedRow(row)}
                    aria-label={`Open actions for ${row.description ?? row.category}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="truncate text-sm font-medium">{row.userName}</p>
                        </div>
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
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</p>
                        <span className={row.type === "income" ? "mt-1 inline-block font-semibold text-success" : "mt-1 inline-block font-semibold text-rose-600"}>
                          {row.type === "income" ? "+ " : "- "}
                          <MoneyValue value={row.amount} />
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{row.description ?? "No description"}</p>
                  </button>
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
                              size="icon"
                              onClick={() => {
                                setEditing(row);
                                setDialogOpen(true);
                              }}
                              aria-label={`Edit ${row.description ?? row.category}`}
                            >
                              <Pencil className="h-4 w-4" />
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
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center justify-between gap-3 sm:flex-row sm:items-center sm:gap-3">
                  <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
                  <Badge variant="secondary" className="w-fit">{filteredRows.length} records</Badge>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                  <Button className="w-full sm:w-auto" variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
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

      <Sheet open={isMobile && filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Filter by date range</SheetTitle>
            <SheetDescription>Choose a start and end date to narrow the transaction list.</SheetDescription>
          </SheetHeader>
          <div className="p-5">
            <DateRangeFilterPanel
              fromDate={fromDate}
              toDate={toDate}
              isPending={isPending}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onClear={clearDateRange}
              onApply={applyDateRange}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(selectedRow)} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Transaction actions</SheetTitle>
            <SheetDescription>
              {selectedRow ? selectedRow.category : "Choose what to do with this transaction."}
            </SheetDescription>
          </SheetHeader>
          {selectedRow ? (
            <div className="space-y-3 p-5">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{selectedRow.userName}</p>
                    <p className="text-sm text-muted-foreground">{selectedRow.description ?? "No description"}</p>
                  </div>
                  <MoneyValue value={selectedRow.amount} className={selectedRow.type === "income" ? "font-semibold text-success" : "font-semibold"} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{formatDateTime(selectedRow.createdAt)}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="justify-center"
                  onClick={() => {
                    setEditing(selectedRow);
                    setSelectedRow(null);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit transaction
                </Button>
                <Button
                  variant="destructive"
                  className="justify-center"
                  disabled={isPending}
                  onClick={() => {
                    setDeletingId(selectedRow.id);
                    setSelectedRow(null);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete transaction
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
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
