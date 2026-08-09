import { toMajor } from "@/lib/money";
import type { CurrencySettings, ProjectDTO } from "@/lib/types";

const COLUMNS = [
  "Client",
  "Client contact",
  "Project title",
  "Service type",
  "Stage",
  "Total fee",
  "Amount paid",
  "Balance",
  "Payment status",
  "Start date",
  "Next deadline",
  "Defence date",
  "Health status",
  "Notes",
] as const;

function escapeCell(value: string | number): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Project list as CSV for accounting. Amounts are written as bare numbers in
 * major units so a spreadsheet sums them; the currency symbol would make the
 * column text. Dates stay ISO for the same reason.
 */
export function projectsToCsv(projects: ProjectDTO[], currency: CurrencySettings): string {
  const rows = projects.map((p) => [
    p.clientName,
    p.clientContact,
    p.projectTitle,
    p.serviceType,
    p.stageName,
    toMajor(p.totalFeeMinor, currency),
    toMajor(p.amountPaidMinor, currency),
    toMajor(p.balanceMinor, currency),
    p.paymentStatus,
    p.startDate,
    p.nextDeadline,
    p.defenceDate,
    p.status,
    p.notes.replace(/\r?\n/g, " "),
  ]);

  return [COLUMNS, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
}
