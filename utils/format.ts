const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
});

const compactFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1
});

export function formatCurrency(value: number) {
  return idrFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactFormatter.format(value);
}

export function formatDate(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatMonthLabel(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    month: "long",
    year: "numeric"
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function formatPercentage(value: number) {
  return `${Math.round(value)}%`;
}
