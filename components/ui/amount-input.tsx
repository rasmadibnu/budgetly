"use client";

import { Input } from "@/components/ui/input";

function formatThousands(value: string) {
  if (!value) return "";
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0
  }).format(Number(value));
}

function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function AmountInput({
  value,
  onValueChange,
  id,
  placeholder
}: {
  value?: number;
  onValueChange: (value: number) => void;
  id?: string;
  placeholder?: string;
}) {
  const displayValue = value && value > 0 ? formatThousands(String(value)) : "";

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={displayValue}
      onChange={(event) => {
        const digits = normalizeDigits(event.target.value);
        onValueChange(digits ? Number(digits) : 0);
      }}
    />
  );
}
