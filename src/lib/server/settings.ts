import { TRACKER_CONFIG } from "@/config/tracker.config";
import { prisma } from "@/lib/prisma";
import type { AppSettingsDTO } from "@/lib/types";

const SETTINGS_ID = "default";

function defaults() {
  const value = TRACKER_CONFIG.defaultSettings;
  return {
    id: SETTINGS_ID,
    companyName: value.companyName,
    logoSrc: value.logoSrc,
    currencyCode: value.code,
    currencySymbol: value.symbol,
    minorUnitsPerMajor: value.minorUnitsPerMajor,
    fractionDigits: value.fractionDigits,
    onboardingComplete: value.onboardingComplete,
  };
}

async function ensureSettings() {
  return prisma.appSettings.upsert({
    where: { id: SETTINGS_ID },
    update: {},
    create: defaults(),
  });
}

function toDTO(row: Awaited<ReturnType<typeof ensureSettings>>): AppSettingsDTO {
  return {
    companyName: row.companyName,
    logoSrc: row.logoSrc,
    currency: {
      code: row.currencyCode,
      symbol: row.currencySymbol,
      minorUnitsPerMajor: row.minorUnitsPerMajor,
      fractionDigits: row.fractionDigits,
    },
    onboardingComplete: row.onboardingComplete,
  };
}

export async function getAppSettings(): Promise<AppSettingsDTO> {
  return toDTO(await ensureSettings());
}

export interface SettingsInput {
  companyName: string;
  logoSrc: string;
  currencyCode: string;
  currencySymbol: string;
  minorUnitsPerMajor: number;
  fractionDigits: number;
}

export async function saveAppSettings(input: SettingsInput): Promise<AppSettingsDTO> {
  const current = await ensureSettings();
  const oldFactor = current.minorUnitsPerMajor;
  const newFactor = input.minorUnitsPerMajor;

  await prisma.$transaction(async (tx) => {
    // Preserve major-unit values when the storage factor changes.
    if (oldFactor !== newFactor) {
      const projects = await tx.project.findMany({ select: { id: true, totalFeeMinor: true } });
      for (const project of projects) {
        await tx.project.update({
          where: { id: project.id },
          data: { totalFeeMinor: Math.round((project.totalFeeMinor / oldFactor) * newFactor) },
        });
      }

      const payments = await tx.payment.findMany({ select: { id: true, amountMinor: true } });
      for (const payment of payments) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { amountMinor: Math.round((payment.amountMinor / oldFactor) * newFactor) },
        });
      }
    }

    await tx.appSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        companyName: input.companyName.trim(),
        logoSrc: input.logoSrc.trim(),
        currencyCode: input.currencyCode.trim().toUpperCase(),
        currencySymbol: input.currencySymbol.trim(),
        minorUnitsPerMajor: newFactor,
        fractionDigits: input.fractionDigits,
        onboardingComplete: true,
      },
    });
  });

  return getAppSettings();
}
