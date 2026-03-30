import type { GoalStatus, InvoiceStatus, Recurrence, Role, TransactionType } from "@/types/database";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: Role;
}

export interface CategoryOption {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface TransactionListItem {
  id: string;
  userName: string;
  type: TransactionType;
  amount: number;
  categoryId?: string | null;
  category: string;
  description: string | null;
  date: string;
  paymentMethod: string | null;
  attachmentUrl: string | null;
}

export interface GoalCardData {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  remaining: number;
  targetDate: string | null;
  status: GoalStatus;
}

export interface BudgetUsageItem {
  id: string;
  category: string;
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface InvoiceItem {
  id: string;
  name: string;
  clientName: string | null;
  amount: number;
  issuedDate: string | null;
  dueDate: string;
  status: "paid" | "unpaid";
  notes: string | null;
}

export interface DashboardSnapshot {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  budgetRemaining: number;
  savingsProgress: number;
  recentTransactions: TransactionListItem[];
  expenseSeries: Array<{ month: string; amount: number }>;
  incomeExpenseSeries: Array<{ month: string; income: number; expense: number }>;
  categoryDistribution: Array<{ name: string; value: number }>;
  upcomingInvoices: InvoiceItem[];
  activeGoals: GoalCardData[];
}

export interface MonthlyReportRecord {
  id: string;
  month: string;
  createdAt: string;
  summary: {
    month: string;
    income: number;
    expense: number;
    net: number;
    budgets: BudgetUsageItem[];
    goals: GoalCardData[];
    aiReport?: {
      overview: string;
      insights: string[];
      risks: string[];
      actions: string[];
      generatedAt: string;
    };
  };
}
