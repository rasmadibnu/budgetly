"use client";

import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";

export function DatePickerField({
  value,
  onChange,
  placeholder = "Pick a date",
  id
}: {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "h-9 w-full justify-start rounded-lg border-input bg-background px-3 text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-2">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            onChange(`${year}-${month}-${day}`);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
