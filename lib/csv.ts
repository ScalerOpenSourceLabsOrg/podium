export function convertToCsv<T extends Record<string, any>>(
  rows: T[],
  headers?: { key: keyof T; label: string }[],
): string {
  if (rows.length === 0) return "";

  const keys = headers
    ? headers.map((h) => h.key)
    : (Object.keys(rows[0]) as (keyof T)[]);
  const headerRow = headers
    ? headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(",")
    : keys.map((k) => `"${String(k).replace(/"/g, '""')}"`).join(",");

  const dataRows = rows.map((row) =>
    keys
      .map((key) => {
        const val = row[key];
        if (val === null || val === undefined) return '""';
        const str = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}
