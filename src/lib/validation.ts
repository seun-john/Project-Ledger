import { z } from "zod";
import { TRACKER_CONFIG } from "@/config/tracker.config";

/** "" (cleared) or a calendar date. */
const dateOnly = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), { message: "Expected YYYY-MM-DD" });

const money = z.coerce.number().finite().min(0, "Amount cannot be negative");

export const projectCreateSchema = z.object({
  clientName: z.string().trim().min(1, "Client name is required"),
  clientContact: z.string().trim().default(""),
  projectTitle: z.string().trim().min(1, "Project title is required"),
  serviceType: z.string().trim().min(1),
  stageId: z.string().min(1, "Stage is required"),
  totalFee: money.default(0),
  startDate: dateOnly.default(""),
  nextDeadline: dateOnly.default(""),
  defenceDate: dateOnly.default(""),
  notes: z.string().default(""),
});

/** Patch shape — a stage drag sends only `stageId`, a notes edit only `notes`. */
export const projectUpdateSchema = projectCreateSchema.partial();

export const paymentCreateSchema = z.object({
  amount: money.refine((v) => v > 0, "Payment amount must be greater than zero"),
  date: dateOnly.default(""),
  method: z.enum(TRACKER_CONFIG.paymentMethods),
  note: z.string().trim().default(""),
});

export const stagesSaveSchema = z.object({
  stages: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        name: z.string().trim().min(1, "Stage name cannot be empty"),
      }),
    )
    .min(1, "A pipeline needs at least one stage"),
});

export const settingsSaveSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(100),
  logoSrc: z
    .string()
    .trim()
    .max(700_000, "Logo is too large")
    .refine(
      (value) => value === "" || value.startsWith("data:image/") || /^https?:\/\//i.test(value),
      "Use an image URL or upload an image file",
    ),
  currencyCode: z.string().trim().min(3).max(6),
  currencySymbol: z.string().trim().min(1).max(8),
  minorUnitsPerMajor: z.coerce.number().int().min(1).max(1_000_000),
  fractionDigits: z.coerce.number().int().min(0).max(6),
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
