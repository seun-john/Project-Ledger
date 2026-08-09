"use client";

import { useEffect, useState } from "react";

interface Props {
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="modal modal--confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="modal-title modal-title--sm" id="confirm-title">
        {title}
      </div>
      <div className="modal-text">{body}</div>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          className={`btn ${destructive ? "btn-danger" : "btn-primary btn-primary--sm"}`}
          disabled={working}
          onClick={async () => {
            setWorking(true);
            try {
              await onConfirm();
            } finally {
              setWorking(false);
            }
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
