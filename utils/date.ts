export function getCurrentMonthKey(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit"
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  return `${year}-${month}`;
}

export function normalizeMonthKey(month?: string | null) {
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  return getCurrentMonthKey();
}

export function getMonthDateRange(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { start, end };
}

export function addRecurrence(date: string, recurrence: "monthly" | "yearly" | "one-time") {
  const value = new Date(date);

  if (recurrence === "monthly") {
    value.setMonth(value.getMonth() + 1);
  }

  if (recurrence === "yearly") {
    value.setFullYear(value.getFullYear() + 1);
  }

  return value.toISOString();
}
