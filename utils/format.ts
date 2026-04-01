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

export function formatMobileCurrency(value: number) {
  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000) {
    const formatted = absolute % 1_000_000_000 === 0
      ? (absolute / 1_000_000_000).toFixed(0)
      : (absolute / 1_000_000_000).toFixed(1);
    return `${value < 0 ? "-" : ""}${formatted}b`;
  }

  if (absolute >= 1_000_000) {
    const formatted = absolute % 1_000_000 === 0
      ? (absolute / 1_000_000).toFixed(0)
      : (absolute / 1_000_000).toFixed(1);
    return `${value < 0 ? "-" : ""}${formatted}m`;
  }

  if (absolute >= 1_000) {
    const formatted = absolute % 1_000 === 0
      ? (absolute / 1_000).toFixed(0)
      : (absolute / 1_000).toFixed(1);
    return `${value < 0 ? "-" : ""}${formatted}k`;
  }

  return `${value}`;
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

export function formatDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

export function formatStatusLabel(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}
