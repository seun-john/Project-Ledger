/** Shapes handed to the client. Money is in minor units; dates are "YYYY-MM-DD" strings. */

export type HealthStatus = "On track" | "At risk" | "Overdue" | "Completed";
export type PaymentStatus = "Not started" | "Partial" | "Paid in full";

export interface CurrencySettings {
  code: string;
  symbol: string;
  minorUnitsPerMajor: number;
  fractionDigits: number;
}

export interface AppSettingsDTO {
  companyName: string;
  logoSrc: string;
  currency: CurrencySettings;
  onboardingComplete: boolean;
}

export interface StageDTO {
  id: string;
  name: string;
  position: number;
  /** The last stage in the pipeline — reaching it means the project is done. */
  isTerminal: boolean;
  projectCount: number;
}

export interface PaymentDTO {
  id: string;
  amountMinor: number;
  amountFmt: string;
  date: string;
  dateFmt: string;
  method: string;
  note: string;
}

export interface ProjectDTO {
  id: string;
  clientName: string;
  clientContact: string;
  projectTitle: string;
  serviceType: string;
  stageId: string;
  stageName: string;

  totalFeeMinor: number;
  amountPaidMinor: number;
  balanceMinor: number;
  totalFeeFmt: string;
  amountPaidFmt: string;
  balanceFmt: string;
  /** Payments exceed the fee — surfaced so it can't go unnoticed (spec §4). */
  isOverpaid: boolean;
  paidPercent: number;
  paymentStatus: PaymentStatus;

  startDate: string;
  nextDeadline: string;
  defenceDate: string;
  startDateFmt: string;
  nextDeadlineFmt: string;
  defenceDateFmt: string;

  status: HealthStatus;
  notes: string;

  nextStageId: string | null;
  nextStageName: string | null;

  payments: PaymentDTO[];
}

export interface DashboardMetrics {
  activeProjects: number;
  outstandingBalanceMinor: number;
  outstandingBalanceFmt: string;
  dueThisWeek: number;
  overdue: number;
}
