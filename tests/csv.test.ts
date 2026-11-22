import { describe, expect, it } from "vitest";
import { convertToCsv } from "@/lib/csv";

describe("CSV Sanitization and Formula Injection Protection (CWE-1236)", () => {
  it("neutralizes formula prefixes like '=', '+', '-', '@'", () => {
    const maliciousRows = [
      {
        name: "=cmd|'/C calc'!A0",
        email: "+123456",
        projectTitle: "-2+5+cmd|' /C calc'!A0",
        bio: "@SUM(1+1)*cmd|' /C calc'!A0",
      },
    ];

    const csv = convertToCsv(maliciousRows);

    // Each cell starting with =, +, -, @ must be prefixed with a single quote '
    expect(csv).toContain("\"'=cmd|'/C calc'!A0\"");
    expect(csv).toContain("\"'+123456\"");
    expect(csv).toContain("\"'-2+5+cmd|' /C calc'!A0\"");
    expect(csv).toContain("\"'@SUM(1+1)*cmd|' /C calc'!A0\"");
  });

  it("handles normal safe data without altering safe values", () => {
    const safeRows = [
      {
        name: "Ada Lovelace",
        email: "ada@example.com",
        score: 95,
      },
    ];

    const csv = convertToCsv(safeRows);
    expect(csv).toContain('"Ada Lovelace"');
    expect(csv).toContain('"ada@example.com"');
    expect(csv).toContain('"95"');
  });

  it("escapes internal quotes properly", () => {
    const quotedRows = [
      {
        title: 'Project with "Special" Quotes',
      },
    ];

    const csv = convertToCsv(quotedRows);
    expect(csv).toContain('"Project with ""Special"" Quotes"');
  });
});
