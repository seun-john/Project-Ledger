import type { HealthStatus, PaymentStatus } from "@/lib/types";

const HEALTH_CLASS: Record<HealthStatus, string> = {
  "On track": "badge--ok",
  "At risk": "badge--risk",
  Overdue: "badge--overdue",
  Completed: "badge--done",
};

const PAYMENT_CLASS: Record<PaymentStatus, string> = {
  "Not started": "badge--pay-notstarted",
  Partial: "badge--pay-partial",
  "Paid in full": "badge--pay-paid",
};

export function StatusBadge({
  status,
  withDot = false,
  size,
}: {
  status: HealthStatus;
  withDot?: boolean;
  size?: "md";
}) {
  return (
    <span className={`badge ${HEALTH_CLASS[status]} ${size === "md" ? "badge--md" : ""}`}>
      {withDot ? <span className="badge-dot" aria-hidden="true" /> : null}
      {status}
    </span>
  );
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`badge ${PAYMENT_CLASS[status]}`}>{status}</span>;
}

export function OverpaidBadge() {
  return <span className="badge badge--risk">Overpaid</span>;
}
