"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/utils/cn";

export function Progress({ className, value = 0 }: { className?: string; value?: number }) {
  return (
    <ProgressPrimitive.Root className={cn("relative h-3 w-full overflow-hidden rounded-full bg-muted", className)} value={value}>
      <ProgressPrimitive.Indicator
        className="h-full bg-primary transition-all"
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
