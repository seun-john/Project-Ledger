"use client";

import { useEffect, useRef, useState } from "react";
import { TRACKER_CONFIG } from "@/config/tracker.config";
import { moneyInputStep } from "@/lib/money";
import { OverpaidBadge, PaymentBadge, StatusBadge } from "@/components/Badges";
import type { CurrencySettings, ProjectDTO } from "@/lib/types";

interface PaymentDraft {
  amount: number;
  date: string;
  method: string;
  note: string;
}

interface Props {
  project: ProjectDTO;
  currency: CurrencySettings;
  busy: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveNext: () => void;
  onAddPayment: (payment: PaymentDraft) => Promise<boolean>;
  onDeletePayment: (paymentId: string) => Promise<boolean>;
  onSaveNotes: (notes: string) => Promise<boolean>;
}

function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function ProjectDrawer({
  project,
  currency,
  busy,
  onClose,
  onEdit,
  onDelete,
  onMoveNext,
  onAddPayment,
  onDeletePayment,
  onSaveNotes,
}: Props) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue);
  const [method, setMethod] = useState<string>(TRACKER_CONFIG.paymentMethods[0]);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState(project.notes);

  // Notes are a local draft while typing and saved on blur; the server value
  // wins whenever a different project is opened.
  const notesBaseline = useRef(project.notes);
  useEffect(() => {
    setNotes(project.notes);
    notesBaseline.current = project.notes;
  }, [project.id, project.notes]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;

    const ok = await onAddPayment({
      amount: value,
      date: date || todayInputValue(),
      method,
      note,
    });
    if (ok) {
      setAmount("");
      setNote("");
      setDate(todayInputValue());
    }
  };

  const saveNotesIfChanged = async () => {
    if (notes === notesBaseline.current) return;
    const ok = await onSaveNotes(notes);
    if (ok) notesBaseline.current = notes;
  };

  return (
    <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${project.clientName} — project detail`}>
      <div className="drawer-head">
        <div>
          <div className="drawer-title">{project.clientName}</div>
          <div className="drawer-subtitle">{project.projectTitle}</div>
        </div>
        <button type="button" className="btn-close" onClick={onClose} aria-label="Close panel">
          ×
        </button>
      </div>

      <div className="drawer-body">
        <div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Service type</div>
              <div className="detail-value">{project.serviceType}</div>
            </div>
            <div>
              <div className="detail-label">Stage</div>
              <div className="detail-value">{project.stageName}</div>
            </div>
            <div>
              <div className="detail-label">Start date</div>
              <div className="detail-value">{project.startDateFmt}</div>
            </div>
            <div>
              <div className="detail-label">Next deadline</div>
              <div className="detail-value">{project.nextDeadlineFmt}</div>
            </div>
            <div>
              <div className="detail-label">Defence date</div>
              <div className="detail-value">{project.defenceDateFmt}</div>
            </div>
            <div>
              <div className="detail-label">Health</div>
              <StatusBadge status={project.status} size="md" />
            </div>
          </div>

          {project.clientContact ? (
            <div style={{ marginTop: 14 }}>
              <div className="detail-label">Client contact</div>
              <div className="detail-value">{project.clientContact}</div>
            </div>
          ) : null}
        </div>

        {project.nextStageId ? (
          <button type="button" className="btn-stage-next" onClick={onMoveNext} disabled={busy}>
            Move to {project.nextStageName} →
          </button>
        ) : (
          <div className="hint hint--center">This project is complete.</div>
        )}

        <div>
          <div className="section-title">Payments</div>

          <div className="pay-summary">
            <div className="pay-stat">
              <div className="pay-stat-label">Total fee</div>
              <div className="pay-stat-value">{project.totalFeeFmt}</div>
            </div>
            <div className="pay-stat">
              <div className="pay-stat-label">Paid</div>
              <div className="pay-stat-value">{project.amountPaidFmt}</div>
            </div>
            <div className="pay-stat">
              <div className="pay-stat-label">Balance</div>
              <div className="pay-stat-value">{project.balanceFmt}</div>
            </div>
          </div>

          <div
            className="progress"
            role="progressbar"
            aria-valuenow={project.paidPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Share of fee collected"
          >
            <div className="progress-bar" style={{ width: `${project.paidPercent}%` }} />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <PaymentBadge status={project.paymentStatus} />
            {project.isOverpaid ? <OverpaidBadge /> : null}
          </div>

          <div className="pay-list">
            {project.payments.length === 0 ? (
              <div className="hint">No payments logged yet.</div>
            ) : (
              project.payments.map((payment) => (
                <div key={payment.id} className="pay-row">
                  <div>
                    <div className="pay-row-method">{payment.method}</div>
                    <div className="pay-row-meta">
                      {payment.dateFmt}
                      {payment.note ? ` · ${payment.note}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="pay-row-amount">{payment.amountFmt}</span>
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => onDeletePayment(payment.id)}
                      aria-label={`Remove ${payment.amountFmt} payment from ${payment.dateFmt}`}
                      disabled={busy}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="pay-form" onSubmit={submitPayment}>
            <label className="sr-only" htmlFor="payment-amount">
              Payment amount
            </label>
            <input
              id="payment-amount"
              name="amount"
              type="number"
              min="0"
              step={moneyInputStep(currency)}
              className="input input--sm"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              required
            />

            <label className="sr-only" htmlFor="payment-date">
              Payment date
            </label>
            <input
              id="payment-date"
              name="date"
              type="date"
              className="input input--sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <label className="sr-only" htmlFor="payment-method">
              Payment method
            </label>
            <select
              id="payment-method"
              name="method"
              className="select select--sm"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {TRACKER_CONFIG.paymentMethods.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="payment-note">
              Payment note
            </label>
            <input
              id="payment-note"
              name="note"
              type="text"
              className="input input--sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
            />

            <button type="submit" className="btn btn-primary btn-primary--sm" disabled={busy}>
              Add payment
            </button>
          </form>
        </div>

        <div>
          <div className="section-title">Notes</div>
          <label className="sr-only" htmlFor="project-notes">
            Project notes
          </label>
          <textarea
            id="project-notes"
            className="textarea"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotesIfChanged}
            placeholder="Progress notes, blockers, reminders…"
          />
        </div>
      </div>

      <div className="drawer-foot">
        <button type="button" className="btn-link" onClick={onDelete}>
          Delete project
        </button>
        <button type="button" className="btn btn-outline" onClick={onEdit}>
          Edit project
        </button>
      </div>
    </aside>
  );
}
