import { CalendarClock, CircleDashed } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoneyValue } from "@/components/ui/money-value";
import type { InvoiceItem } from "@/types/app";
import { formatDate } from "@/utils/format";

export function UpcomingBillsCard({ invoices }: { invoices: InvoiceItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client invoices</CardTitle>
        <CardDescription>Recent invoices issued to clients and their payment status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between rounded-2xl border border-border/70 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-secondary p-2">
                {invoice.status === "paid" ? <CalendarClock className="h-4 w-4 text-primary" /> : <CircleDashed className="h-4 w-4 text-warning" />}
              </div>
              <div>
                <p className="font-medium">{invoice.name}</p>
                <p className="text-sm text-muted-foreground">{invoice.clientName ?? "Client"} · Due {formatDate(invoice.dueDate)}</p>
              </div>
            </div>
            <div className="text-right">
              <MoneyValue value={invoice.amount} className="font-semibold" />
              <Badge variant={invoice.status === "paid" ? "success" : "secondary"}>
                {invoice.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
