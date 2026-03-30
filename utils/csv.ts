type CsvRecord = Record<string, string | number | null | undefined>;

function escapeCsvValue(value: CsvRecord[string]) {
  const normalized = value ?? "";
  const stringValue = String(normalized);

  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

export function toCsv<T extends CsvRecord>(rows: T[]) {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(","));

  return [headers.join(","), ...lines].join("\n");
}
