"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/utils/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 w-auto rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-md outline-none",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
