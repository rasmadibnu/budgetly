import { MetricCard } from "@/features/dashboard/components/metric-card";
import { ExpenseChart } from "@/features/dashboard/components/expense-chart";
import { IncomeExpenseChart } from "@/features/dashboard/components/income-expense-chart";
import { CategoryPieChart } from "@/features/dashboard/components/category-pie-chart";
import { RecentTransactionsCard } from "@/features/dashboard/components/recent-transactions-card";
import { BudgetUsageCard } from "@/features/dashboard/components/budget-usage-card";
import { GoalsProgressCard } from "@/features/dashboard/components/goals-progress-card";
import { DailyCashCalendar } from "@/features/dashboard/components/daily-cash-calendar";
import type { DashboardSnapshot } from "@/types/app";
import { formatPercentage } from "@/utils/format";
import { PageHeader } from "@/components/layout/page-header";
import { MoneyValue } from "@/components/ui/money-value";

export function DashboardView({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="📊 Dashboard"
        description="Your household finances at a glance."
      />
      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total balance" value={<><MoneyValue value={snapshot.totalBalance} compact className="sm:hidden" /><MoneyValue value={snapshot.totalBalance} className="hidden sm:inline" /></>} caption="Combined running balance" compact />
        <MetricCard title="Monthly income" value={<><MoneyValue value={snapshot.monthlyIncome} compact className="sm:hidden" /><MoneyValue value={snapshot.monthlyIncome} className="hidden sm:inline" /></>} caption="Income this month" compact />
        <MetricCard title="Monthly expense" value={<><MoneyValue value={snapshot.monthlyExpense} compact className="sm:hidden" /><MoneyValue value={snapshot.monthlyExpense} className="hidden sm:inline" /></>} caption="Spending this month" trend="down" compact />
        <MetricCard title="Budget remaining" value={<><MoneyValue value={snapshot.budgetRemaining} compact className="sm:hidden" /><MoneyValue value={snapshot.budgetRemaining} className="hidden sm:inline" /></>} caption="Left across budgets" compact />
        <div className="col-span-2 xl:col-span-1">
          <MetricCard title="Savings progress" value={formatPercentage(snapshot.savingsProgress)} caption="Avg goal completion" compact />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ExpenseChart dailyData={snapshot.expenseSeriesDaily} monthlyData={snapshot.expenseSeriesMonthly} />
        </div>
        <CategoryPieChart data={snapshot.categoryDistribution} />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <IncomeExpenseChart dailyData={snapshot.incomeExpenseSeriesDaily} monthlyData={snapshot.incomeExpenseSeriesMonthly} />
        </div>
        <BudgetUsageCard budgets={snapshot.budgetHighlights} />
      </div>
      <DailyCashCalendar month={snapshot.dailyCashCalendar[0]?.date.slice(0, 7) ?? ""} entries={snapshot.dailyCashCalendar} />
      <div className="grid gap-4 xl:grid-cols-2">
        <RecentTransactionsCard transactions={snapshot.recentTransactions} />
        <GoalsProgressCard goals={snapshot.activeGoals} />
      </div>
    </div>
  );
}
