"use client";

/* eslint-disable @next/next/no-img-element */
import { TRACKER_CONFIG } from "@/config/tracker.config";
import { useTheme, type ThemePreference } from "@/components/ThemeProvider";
import type { AppSettingsDTO } from "@/lib/types";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

interface Props {
  settings: AppSettingsDTO;
  onOpenSettings: () => void;
  onAddProject: () => void;
}

export function AppHeader({ settings, onOpenSettings, onAddProject }: Props) {
  const { theme, setTheme } = useTheme();
  const initials = settings.companyName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="app-header">
      <div className="brand">
        <div className={`brand-logo ${settings.logoSrc ? "" : "brand-logo--fallback"}`}>
          {settings.logoSrc ? (
            <img src={settings.logoSrc} alt={`${settings.companyName} logo`} />
          ) : (
            <span aria-hidden="true">{initials || "PL"}</span>
          )}
        </div>
        <div className="brand-text">
          <span className="brand-title">{TRACKER_CONFIG.product.name}</span>
          <span className="brand-sub">{settings.companyName}</span>
        </div>
      </div>

      <div className="header-actions">
        <div className="seg seg--header" role="group" aria-label="Colour theme">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`seg-btn ${theme === option.value ? "is-active" : ""}`}
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button type="button" className="btn btn-outline" onClick={onOpenSettings}>
          Settings
        </button>
        <button type="button" className="btn btn-primary" onClick={onAddProject}>
          + New project
        </button>
      </div>
    </header>
  );
}
