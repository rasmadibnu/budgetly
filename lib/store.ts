"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { getCurrentMonthKey } from "@/utils/date";

interface BudgetlyState {
  selectedMonth: string;
  amountsVisible: boolean;
  setSelectedMonth: (month: string) => void;
  toggleAmountsVisible: () => void;
}

export const useBudgetlyStore = create<BudgetlyState>()(
  persist(
    (set) => ({
      selectedMonth: getCurrentMonthKey(),
      amountsVisible: false,
      setSelectedMonth: (selectedMonth) => set({ selectedMonth }),
      toggleAmountsVisible: () => set((state) => ({ amountsVisible: !state.amountsVisible }))
    }),
    {
      name: "budgetly-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedMonth: state.selectedMonth,
        amountsVisible: state.amountsVisible
      })
    }
  )
);
