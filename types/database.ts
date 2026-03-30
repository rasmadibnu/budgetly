export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type TransactionType = "income" | "expense";
export type Role = "owner" | "partner";
export type GoalStatus = "active" | "completed" | "cancelled";
export type Recurrence = "monthly" | "yearly" | "one-time";
export type InvoiceStatus = "pending" | "paid" | "overdue";

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string;
          name: string;
          currency: string;
          timezone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          currency?: string;
          timezone?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["households"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          role: Role;
          password_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          role: Role;
          password_hash: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          role: Role;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          role: Role;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["household_members"]["Insert"]>;
        Relationships: [];
      };
      transaction_categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          type: TransactionType;
          color: string;
          icon: string | null;
          is_system: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          type: TransactionType;
          color?: string;
          icon?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transaction_categories"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category_id: string | null;
          description: string | null;
          date: string;
          payment_method: string | null;
          attachment_url: string | null;
          is_recurring: boolean;
          recurrence_rule: Recurrence | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          type: TransactionType;
          amount: number;
          category_id?: string | null;
          description?: string | null;
          date: string;
          payment_method?: string | null;
          attachment_url?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: Recurrence | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          start_date: string;
          target_date: string | null;
          status: GoalStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          start_date: string;
          target_date?: string | null;
          status?: GoalStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          household_id: string;
          category_id: string;
          month: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id: string;
          month: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["budgets"]["Insert"]>;
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          client_name: string | null;
          amount: number;
          issued_date: string | null;
          due_date: string;
          recurrence: Recurrence;
          status: InvoiceStatus;
          auto_generate: boolean;
          last_paid_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          client_name?: string | null;
          amount: number;
          issued_date?: string | null;
          due_date: string;
          recurrence: Recurrence;
          status?: InvoiceStatus;
          auto_generate?: boolean;
          last_paid_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [];
      };
      invoice_payments: {
        Row: {
          id: string;
          invoice_id: string;
          transaction_id: string | null;
          paid_at: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          transaction_id?: string | null;
          paid_at: string;
          amount: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_payments"]["Insert"]>;
        Relationships: [];
      };
      monthly_reports: {
        Row: {
          id: string;
          household_id: string;
          month: string;
          summary_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          month: string;
          summary_json: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_reports"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: {
      budget_usage: {
        Row: {
          budget_id: string;
          household_id: string;
          month: string;
          category_id: string;
          budget_amount: number;
          spent_amount: number;
          remaining_amount: number;
          usage_percentage: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: {
      app_role: Role;
      transaction_type: TransactionType;
      goal_status: GoalStatus;
      recurrence_type: Recurrence;
      invoice_status: InvoiceStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
