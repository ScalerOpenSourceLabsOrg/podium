/**
 * Converts an array of objects to CSV.
 * Sanitizes fields to prevent CSV / Spreadsheet Formula Injection (CWE-1236).
 */
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

        let str = typeof val === "object" ? JSON.stringify(val) : String(val);

        // CWE-1236: Prevent CSV / Formula Injection
        // If a cell begins with '=', '+', '-', '@', '\t', or '\r', prefix with single-quote
        if (/^[=+\-@\t\r]/.test(str)) {
          str = `'${str}`;
        }

        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}
