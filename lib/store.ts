"use client";

import { create } from "zustand";

import { getCurrentMonthKey } from "@/utils/date";

interface BudgetlyState {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const useBudgetlyStore = create<BudgetlyState>((set) => ({
  selectedMonth: getCurrentMonthKey(),
  setSelectedMonth: (selectedMonth) => set({ selectedMonth })
}));
