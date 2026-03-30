"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/utils/cn";

export function MetricCard({
  title,
  value,
  caption,
  trend = "up"
}: {
  title: string;
  value: React.ReactNode;
  caption: string;
  trend?: "up" | "down";
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="surface p-5">
        <div className="flex items-start justify-between">
          <p className="text-[13px] text-muted-foreground">{title}</p>
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              trend === "up"
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{value}</div>
        <p className="mt-1 text-[12px] text-muted-foreground">{caption}</p>
      </div>
    </motion.div>
  );
}
