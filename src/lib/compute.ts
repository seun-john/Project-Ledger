/**
 * The computed fields from spec §4. Pure functions over already-loaded data so
 * that the board, the table, the drawer and the CSV export can never disagree
 * about what a project's balance or health is.
 */

import { TRACKER_CONFIG } from "@/config/tracker.config";
import { daysUntil } from "@/lib/dates";
import type { HealthStatus, PaymentStatus } from "@/lib/types";

/** amount_paid = sum of the payment log. Never a stored field. */
export function computeAmountPaidMinor(payments: { amountMinor: number }[]): number {
  return payments.reduce((sum, p) => sum + p.amountMinor, 0);
}

/** balance = total_fee − amount_paid. Negative means overpayment, which the UI flags. */
export function computeBalanceMinor(totalFeeMinor: number, amountPaidMinor: number): number {
  return totalFeeMinor - amountPaidMinor;
}

export function computePaymentStatus(totalFeeMinor: number, amountPaidMinor: number): PaymentStatus {
  if (amountPaidMinor <= 0) return "Not started";
  if (totalFeeMinor > 0 && amountPaidMinor >= totalFeeMinor) return "Paid in full";
  return "Partial";
}

/**
 * Health indicator. A project sitting in the terminal stage is Completed and is
 * never marked overdue, however far past its last deadline it is.
 */
export function computeHealthStatus(
  nextDeadline: Date | null,
  isTerminalStage: boolean,
  now: Date = new Date(),
): HealthStatus {
  if (isTerminalStage) return "Completed";
  const days = daysUntil(nextDeadline, now);
  if (days === null) return "On track";
  if (days < 0) return "Overdue";
  if (days <= TRACKER_CONFIG.atRiskDays) return "At risk";
  return "On track";
}

/** Share of the fee collected, clamped to 0–100 for the drawer progress bar. */
export function computePaidPercent(totalFeeMinor: number, amountPaidMinor: number): number {
  if (totalFeeMinor <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((amountPaidMinor / totalFeeMinor) * 100)));
}
