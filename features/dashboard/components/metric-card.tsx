"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/utils/cn";

export function MetricCard({
  title,
  value,
  caption,
  trend = "up",
  compact = false
}: {
  title: string;
  value: React.ReactNode;
  caption: string;
  trend?: "up" | "down";
  compact?: boolean;
}) {
  const TrendIcon = trend === "up" ? ArrowUpRight : ArrowDownRight;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="surface p-3 sm:p-5">
        <div className="flex items-start justify-between">
          <p className="text-xs text-muted-foreground sm:text-[13px]">{title}</p>
          <div
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md sm:h-7 sm:w-7",
              trend === "up"
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
          </div>
        </div>
        <div className={cn("mt-1 font-semibold tracking-[-0.02em] sm:mt-2 sm:text-2xl", compact ? "text-base" : "text-lg")}>{value}</div>
        <p className="mt-1 text-[11px] text-muted-foreground sm:text-[12px]">{caption}</p>
      </div>
    </motion.div>
  );
}
