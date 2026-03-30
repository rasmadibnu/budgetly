import { MetricCard } from "@/features/dashboard/components/metric-card";
import { ExpenseChart } from "@/features/dashboard/components/expense-chart";
import { IncomeExpenseChart } from "@/features/dashboard/components/income-expense-chart";
import { CategoryPieChart } from "@/features/dashboard/components/category-pie-chart";
import { RecentTransactionsCard } from "@/features/dashboard/components/recent-transactions-card";
import { BudgetUsageCard } from "@/features/dashboard/components/budget-usage-card";
import { GoalsProgressCard } from "@/features/dashboard/components/goals-progress-card";
import type { DashboardSnapshot } from "@/types/app";
import { formatPercentage } from "@/utils/format";
import { PageHeader } from "@/components/layout/page-header";
import { MoneyValue } from "@/components/ui/money-value";

export function DashboardView({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="📊 Dashboard"
        description="Your household finances at a glance."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total balance" value={<MoneyValue value={snapshot.totalBalance} />} caption="Combined running balance" />
        <MetricCard title="Monthly income" value={<MoneyValue value={snapshot.monthlyIncome} />} caption="Income this month" />
        <MetricCard title="Monthly expense" value={<MoneyValue value={snapshot.monthlyExpense} />} caption="Spending this month" trend="down" />
        <MetricCard title="Budget remaining" value={<MoneyValue value={snapshot.budgetRemaining} />} caption="Left across budgets" />
        <MetricCard title="Savings progress" value={formatPercentage(snapshot.savingsProgress)} caption="Avg goal completion" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ExpenseChart data={snapshot.expenseSeries} />
        </div>
        <CategoryPieChart data={snapshot.categoryDistribution} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <IncomeExpenseChart data={snapshot.incomeExpenseSeries} />
        </div>
        <BudgetUsageCard budgets={snapshot.budgetHighlights} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RecentTransactionsCard transactions={snapshot.recentTransactions} />
        <GoalsProgressCard goals={snapshot.activeGoals} />
      </div>
    </div>
  );
}
