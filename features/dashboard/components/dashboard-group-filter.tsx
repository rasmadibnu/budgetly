"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CategoryReportGroup } from "@/types/database";
import { cn } from "@/utils/cn";

const FILTER_OPTIONS: Array<{ value: CategoryReportGroup | "all"; label: string }> = [
  { value: "all", label: "No filter" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "tersier", label: "Tersier" }
];

export function DashboardGroupFilter({ value }: { value?: CategoryReportGroup }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeValue = value ?? "all";

  const setFilter = (nextValue: CategoryReportGroup | "all") => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === "all") {
      params.delete("group");
    } else {
      params.set("group", nextValue);
    }

    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname);
  };

  return (
    <div className="flex w-full flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1 sm:w-auto">
      <div className="hidden h-7 items-center px-2 text-muted-foreground sm:flex">
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </div>
      {FILTER_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="sm"
          variant={activeValue === option.value ? "default" : "ghost"}
          className={cn("h-7 flex-1 px-2 text-xs sm:flex-none", activeValue !== option.value && "text-muted-foreground")}
          onClick={() => setFilter(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
