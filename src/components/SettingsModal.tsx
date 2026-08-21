"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { useDialogFocus } from "@/lib/useDialogFocus";
import type { AppSettingsDTO, StageDTO } from "@/lib/types";
import type { SettingsPayload } from "@/lib/client/api-client";

interface EditableStage {
  id?: string;
  name: string;
  projectCount: number;
}

interface Props {
  settings: AppSettingsDTO;
  stages: StageDTO[];
  required: boolean;
  onSave: (settings: SettingsPayload, stages: { id?: string; name: string }[]) => Promise<void>;
  onClose: () => void;
}

export function SettingsModal({ settings, stages, required, onSave, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useDialogFocus(panelRef);

  const [companyName, setCompanyName] = useState(settings.companyName);
  const [logoSrc, setLogoSrc] = useState(settings.logoSrc);
  const [currencyCode, setCurrencyCode] = useState(settings.currency.code);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency.symbol);
  const [minorUnitsPerMajor, setMinorUnitsPerMajor] = useState(
    String(settings.currency.minorUnitsPerMajor),
  );
  const [fractionDigits, setFractionDigits] = useState(String(settings.currency.fractionDigits));
  const [rows, setRows] = useState<EditableStage[]>(() =>
    stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      projectCount: stage.projectCount,
    })),
  );
  const [newStageName, setNewStageName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !required) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, required]);

  const rename = (index: number, name: string) =>
    setRows((previous) =>
      previous.map((row, rowIndex) => (rowIndex === index ? { ...row, name } : row)),
    );

  const move = (index: number, delta: number) =>
    setRows((previous) => {
      const target = index + delta;
      if (target < 0 || target >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const remove = (index: number) => {
    const row = rows[index];
    if (row.projectCount > 0) {
      setLocalError(
        `“${row.name}” still has ${row.projectCount} project(s). Move them before removing this stage.`,
      );
      return;
    }
    if (rows.length <= 1) {
      setLocalError("A pipeline needs at least one stage.");
      return;
    }
    setRows((previous) => previous.filter((_, rowIndex) => rowIndex !== index));
    setLocalError(null);
  };

  const addStage = () => {
    const name = newStageName.trim();
    if (!name) return;
    setRows((previous) => [...previous, { name, projectCount: 0 }]);
    setNewStageName("");
    setLocalError(null);
  };

  const uploadLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Choose an image file for the logo.");
      return;
    }
    if (file.size > 500_000) {
      setLocalError("Keep the logo under 500 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoSrc(String(reader.result ?? ""));
      setLocalError(null);
    };
    reader.onerror = () => setLocalError("The logo file could not be read.");
    reader.readAsDataURL(file);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyName.trim()) {
      setLocalError("Company name is required.");
      return;
    }
    if (rows.length === 0 || rows.some((row) => !row.name.trim())) {
      setLocalError("Every pipeline stage needs a name.");
      return;
    }

    const factor = Number(minorUnitsPerMajor);
    const digits = Number(fractionDigits);
    if (!Number.isInteger(factor) || factor < 1 || !Number.isInteger(digits) || digits < 0) {
      setLocalError("Currency precision values must be valid whole numbers.");
      return;
    }

    setSaving(true);
    setLocalError(null);
    try {
      await onSave(
        {
          companyName: companyName.trim(),
          logoSrc: logoSrc.trim(),
          currencyCode: currencyCode.trim().toUpperCase(),
          currencySymbol: currencySymbol.trim(),
          minorUnitsPerMajor: factor,
          fractionDigits: digits,
        },
        rows.map((row) => ({ id: row.id, name: row.name.trim() })),
      );
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      className="modal modal--settings"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="modal-head">
        <div>
          <div className="modal-title" id="settings-title">
            {required ? "Welcome to Project Ledger" : "Settings"}
          </div>
          <p className="settings-intro">
            {required
              ? "Set up your workspace. Everything here stays in your local database."
              : "Update your brand, currency, and pipeline without editing code."}
          </p>
        </div>
        {!required ? (
          <button type="button" className="btn-close btn-close--sm" onClick={onClose} aria-label="Close">
            ×
          </button>
        ) : null}
      </div>

      <form onSubmit={save} className="settings-form">
        <section className="settings-section">
          <h2 className="settings-heading">Brand</h2>
          <div className="form-grid">
            <label className="field field--full">
              <span className="field-label">Company name</span>
              <input className="input" value={companyName} onChange={(event) => setCompanyName(event.target.value)} required />
            </label>

            <label className="field field--full">
              <span className="field-label">Logo URL (optional)</span>
              <input
                className="input"
                type="url"
                value={logoSrc.startsWith("data:") ? "" : logoSrc}
                onChange={(event) => setLogoSrc(event.target.value)}
                placeholder="https://example.com/logo.png"
              />
            </label>

            <div className="field field--full">
              <span className="field-label">Or upload a logo</span>
              <div className="logo-setting-row">
                {logoSrc ? <img className="logo-preview" src={logoSrc} alt="Logo preview" /> : null}
                <input type="file" accept="image/*" onChange={(event) => uploadLogo(event.target.files?.[0])} />
                {logoSrc ? (
                  <button type="button" className="btn-link" onClick={() => setLogoSrc("")}>
                    Remove logo
                  </button>
                ) : null}
              </div>
              <span className="field-help">PNG, JPG, WebP, or GIF; maximum 500 KB.</span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="settings-heading">Currency</h2>
          <div className="settings-currency-grid">
            <label className="field">
              <span className="field-label">Code</span>
              <input className="input" value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value)} maxLength={6} required />
            </label>
            <label className="field">
              <span className="field-label">Symbol</span>
              <input className="input" value={currencySymbol} onChange={(event) => setCurrencySymbol(event.target.value)} maxLength={8} required />
            </label>
            <label className="field">
              <span className="field-label">Minor units per major</span>
              <input className="input" type="number" min="1" max="1000000" value={minorUnitsPerMajor} onChange={(event) => setMinorUnitsPerMajor(event.target.value)} required />
            </label>
            <label className="field">
              <span className="field-label">Display decimal places</span>
              <input className="input" type="number" min="0" max="6" value={fractionDigits} onChange={(event) => setFractionDigits(event.target.value)} required />
            </label>
          </div>
          <p className="field-help">For USD, use 100 minor units and 2 decimal places. Existing amounts are rescaled safely if this changes.</p>
        </section>

        <section className="settings-section">
          <h2 className="settings-heading">Pipeline stages</h2>
          <p className="field-help">The final stage is treated as completed.</p>
          <div className="settings-stage-list">
            {rows.map((row, index) => (
              <div className="stage-row" key={row.id ?? `new-${index}`}>
                <input className="input input--stage" value={row.name} onChange={(event) => rename(index, event.target.value)} aria-label={`Stage ${index + 1} name`} />
                <button type="button" className="icon-btn" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move ${row.name} up`}>↑</button>
                <button type="button" className="icon-btn" disabled={index === rows.length - 1} onClick={() => move(index, 1)} aria-label={`Move ${row.name} down`}>↓</button>
                <button type="button" className="btn-link" disabled={rows.length <= 1} onClick={() => remove(index)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="stage-add">
            <input className="input input--sm" value={newStageName} onChange={(event) => setNewStageName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addStage(); } }} placeholder="New stage name" />
            <button type="button" className="btn btn-primary btn-primary--sm" disabled={!newStageName.trim()} onClick={addStage}>Add stage</button>
          </div>
        </section>

        {localError ? <div className="form-error" role="alert">{localError}</div> : null}

        <div className="modal-actions modal-actions--spaced settings-actions">
          {!required ? <button type="button" className="btn btn-outline btn-outline--md" onClick={onClose}>Cancel</button> : <span />}
          <button type="submit" className="btn btn-primary btn-primary--md" disabled={saving}>{saving ? "Saving…" : required ? "Finish setup" : "Save settings"}</button>
        </div>
      </form>
    </div>
  );
}
