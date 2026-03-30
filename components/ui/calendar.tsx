"use client";

import { id } from "date-fns/locale";
import { DayPicker } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const currentYear = new Date().getFullYear();

  return (
    <DayPicker
      locale={id}
      weekStartsOn={1}
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown"
      hideNavigation
      startMonth={new Date(currentYear - 10, 0)}
      endMonth={new Date(currentYear + 10, 11)}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "inline-flex items-center whitespace-nowrap pr-5 text-sm font-medium leading-none",
        dropdowns: "flex items-center gap-2",
        dropdown_root: "relative inline-flex h-9 min-w-[110px] items-center rounded-md border border-input bg-background px-3 text-sm shadow-sm",
        dropdown: "absolute inset-0 z-10 opacity-0",
        chevron: "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70",
        nav: "space-x-1 flex items-center",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon" }), "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon" }), "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100"),
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "mt-2 grid grid-cols-7",
        day: "h-9 w-9 p-0 text-center text-sm",
        day_button: cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames
      }}
      {...props}
    />
  );
}
