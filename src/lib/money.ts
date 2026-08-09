import { TRACKER_CONFIG } from "@/config/tracker.config";
import type { CurrencySettings } from "@/lib/types";

export const DEFAULT_CURRENCY: CurrencySettings = {
  code: TRACKER_CONFIG.defaultSettings.code,
  symbol: TRACKER_CONFIG.defaultSettings.symbol,
  minorUnitsPerMajor: TRACKER_CONFIG.defaultSettings.minorUnitsPerMajor,
  fractionDigits: TRACKER_CONFIG.defaultSettings.fractionDigits,
};

/** Major units to integer minor units for exact storage. */
export function toMinor(major: number, currency: CurrencySettings = DEFAULT_CURRENCY): number {
  if (!Number.isFinite(major)) return 0;
  return Math.round(major * currency.minorUnitsPerMajor);
}

export function toMajor(minor: number, currency: CurrencySettings = DEFAULT_CURRENCY): number {
  return minor / currency.minorUnitsPerMajor;
}

export function formatMoney(minor: number, currency: CurrencySettings = DEFAULT_CURRENCY): string {
  const major = toMajor(minor, currency);
  const sign = major < 0 ? "-" : "";
  const abs = Math.abs(major).toLocaleString("en-US", {
    minimumFractionDigits: currency.fractionDigits,
    maximumFractionDigits: currency.fractionDigits,
  });
  return `${sign}${currency.symbol}${abs}`;
}

export function moneyInputStep(currency: CurrencySettings): number {
  return 1 / currency.minorUnitsPerMajor;
}
