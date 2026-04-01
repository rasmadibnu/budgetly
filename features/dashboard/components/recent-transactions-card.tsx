import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoneyValue } from "@/components/ui/money-value";
import type { TransactionListItem } from "@/types/app";
import { formatDateTime } from "@/utils/format";

export function RecentTransactionsCard({ transactions }: { transactions: TransactionListItem[] }) {
  return (
    <Card className="border-0 bg-transparent shadow-none md:rounded-xl md:border md:bg-card">
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>The latest household activity across both users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-0 pb-0 md:space-y-4 md:px-5 md:pb-5">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="rounded-2xl border border-border p-4 md:border-0 md:bg-muted/40">
            <div className="flex items-start justify-between gap-3 md:items-center">
              <div className="min-w-0 md:flex-1">
                <p className="truncate font-medium md:hidden">{transaction.userName}</p>
                <div className="hidden md:flex md:items-center md:gap-3">
                  <p className="truncate font-medium">{transaction.category}</p>
                  <Badge variant="outline" className="border-transparent">
                    {transaction.userName}
                  </Badge>
                </div>
                <Badge
                  variant="outline"
                  className="mt-2 border-transparent md:hidden"
                >
                  {transaction.category}
                </Badge>
                <p className="mt-3 text-sm text-muted-foreground md:mt-1">{transaction.description ?? "No description"}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt)}</p>
                <span className={transaction.type === "income" ? "mt-1 inline-block font-semibold text-success" : "mt-1 inline-block font-semibold text-rose-600"}>
                  {transaction.type === "income" ? "+ " : "- "}
                  <MoneyValue value={transaction.amount} />
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
