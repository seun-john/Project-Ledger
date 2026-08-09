"use client";

import { useEffect, useState } from "react";
import { TRACKER_CONFIG } from "@/config/tracker.config";
import { moneyInputStep, toMajor } from "@/lib/money";
import type { CurrencySettings, ProjectDTO, StageDTO } from "@/lib/types";

export interface ProjectFormValues {
  clientName: string;
  clientContact: string;
  projectTitle: string;
  serviceType: string;
  stageId: string;
  /** Major units, as typed. */
  totalFee: number;
  startDate: string;
  nextDeadline: string;
  defenceDate: string;
  notes: string;
}

interface Props {
  mode: "add" | "edit";
  project?: ProjectDTO;
  stages: StageDTO[];
  currency: CurrencySettings;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ProjectFormModal({ mode, project, stages, currency, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState(() => ({
    clientName: project?.clientName ?? "",
    clientContact: project?.clientContact ?? "",
    projectTitle: project?.projectTitle ?? "",
    serviceType: project?.serviceType ?? TRACKER_CONFIG.serviceTypes[0],
    stageId: project?.stageId ?? stages[0]?.id ?? "",
    totalFee: project ? String(toMajor(project.totalFeeMinor, currency)) : "",
    startDate: project?.startDate ?? "",
    nextDeadline: project?.nextDeadline ?? "",
    defenceDate: project?.defenceDate ?? "",
    notes: project?.notes ?? "",
  }));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const set = (field: keyof typeof values) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setValues((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit({ ...values, totalFee: Number(values.totalFee) || 0 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal modal--form" role="dialog" aria-modal="true" aria-labelledby="project-form-title">
      <div className="modal-title" id="project-form-title">
        {mode === "add" ? "New project" : "Edit project"}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field field--full">
            <span className="field-label">Project title / topic *</span>
            <input
              className="input"
              type="text"
              required
              value={values.projectTitle}
              onChange={set("projectTitle")}
            />
          </label>

          <label className="field">
            <span className="field-label">Client name *</span>
            <input
              className="input"
              type="text"
              required
              value={values.clientName}
              onChange={set("clientName")}
            />
          </label>

          <label className="field">
            <span className="field-label">Client contact</span>
            <input
              className="input"
              type="text"
              value={values.clientContact}
              onChange={set("clientContact")}
              placeholder="Email or phone"
            />
          </label>

          <label className="field">
            <span className="field-label">Service type</span>
            <select className="select" value={values.serviceType} onChange={set("serviceType")}>
              {TRACKER_CONFIG.serviceTypes.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Stage</span>
            <select className="select" value={values.stageId} onChange={set("stageId")}>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Total fee ({currency.symbol})</span>
            <input
              className="input"
              type="number"
              min="0"
              step={moneyInputStep(currency)}
              value={values.totalFee}
              onChange={set("totalFee")}
            />
          </label>

          <label className="field">
            <span className="field-label">Start date</span>
            <input className="input" type="date" value={values.startDate} onChange={set("startDate")} />
          </label>

          <label className="field">
            <span className="field-label">Next deadline</span>
            <input
              className="input"
              type="date"
              value={values.nextDeadline}
              onChange={set("nextDeadline")}
            />
          </label>

          <label className="field">
            <span className="field-label">Defence date</span>
            <input className="input" type="date" value={values.defenceDate} onChange={set("defenceDate")} />
          </label>

          <label className="field field--full">
            <span className="field-label">Notes</span>
            <textarea className="textarea" rows={3} value={values.notes} onChange={set("notes")} />
          </label>
        </div>

        <div className="modal-actions modal-actions--spaced">
          <button type="button" className="btn btn-outline btn-outline--md" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-primary--md" disabled={submitting}>
            {mode === "add" ? "Add project" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
