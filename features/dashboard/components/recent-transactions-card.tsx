import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoneyValue } from "@/components/ui/money-value";
import type { TransactionListItem } from "@/types/app";
import { formatDate } from "@/utils/format";

export function RecentTransactionsCard({ transactions }: { transactions: TransactionListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent transactions</CardTitle>
        <CardDescription>The latest household activity across both users.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2 ${transaction.type === "income" ? "bg-success/15 text-success" : "bg-warning/20 text-foreground"}`}>
                {transaction.type === "income" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-medium">{transaction.category}</p>
                <p className="text-sm text-muted-foreground">{transaction.description ?? "No description"} · {transaction.userName}</p>
              </div>
            </div>
            <div className="text-right">
              <MoneyValue value={transaction.amount} className="font-semibold" />
              <div className="mt-1 flex items-center justify-end gap-2">
                <Badge variant="outline">{formatDate(transaction.date)}</Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
