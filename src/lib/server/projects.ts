import { prisma } from "@/lib/prisma";
import { getActorContext, ownerScope } from "@/lib/tenancy";
import {
  computeAmountPaidMinor,
  computeBalanceMinor,
  computeHealthStatus,
  computePaidPercent,
  computePaymentStatus,
} from "@/lib/compute";
import { TRACKER_CONFIG } from "@/config/tracker.config";
import { formatDate, parseDateOnly, toDateInputValue, daysUntil } from "@/lib/dates";
import { formatMoney, toMinor } from "@/lib/money";
import { getAppSettings } from "@/lib/server/settings";
import type { CurrencySettings, DashboardMetrics, ProjectDTO } from "@/lib/types";

export class NotFoundError extends Error {
  constructor(what = "Project") {
    super(`${what} not found.`);
    this.name = "NotFoundError";
  }
}

type ProjectRow = Awaited<ReturnType<typeof loadRows>>[number];

async function loadRows() {
  const ctx = await getActorContext();
  return prisma.project.findMany({
    where: ownerScope(ctx),
    include: { stage: true, payments: { orderBy: { date: "desc" } } },
  });
}

/**
 * The one place a database row becomes the shape the UI renders. Health and
 * money are derived here so every view — board, table, drawer, CSV — agrees.
 */
function toDTO(
  row: ProjectRow,
  orderedStages: { id: string; name: string }[],
  currency: CurrencySettings,
  now: Date,
): ProjectDTO {
  const stageIndex = orderedStages.findIndex((s) => s.id === row.stageId);
  const isTerminal = stageIndex !== -1 && stageIndex === orderedStages.length - 1;
  const nextStage = stageIndex === -1 ? undefined : orderedStages[stageIndex + 1];

  const amountPaidMinor = computeAmountPaidMinor(row.payments);
  const balanceMinor = computeBalanceMinor(row.totalFeeMinor, amountPaidMinor);

  return {
    id: row.id,
    clientName: row.clientName,
    clientContact: row.clientContact ?? "",
    projectTitle: row.projectTitle,
    serviceType: row.serviceType,
    stageId: row.stageId,
    stageName: row.stage.name,

    totalFeeMinor: row.totalFeeMinor,
    amountPaidMinor,
    balanceMinor,
    totalFeeFmt: formatMoney(row.totalFeeMinor, currency),
    amountPaidFmt: formatMoney(amountPaidMinor, currency),
    balanceFmt: formatMoney(balanceMinor, currency),
    isOverpaid: balanceMinor < 0,
    paidPercent: computePaidPercent(row.totalFeeMinor, amountPaidMinor),
    paymentStatus: computePaymentStatus(row.totalFeeMinor, amountPaidMinor),

    startDate: toDateInputValue(row.startDate),
    nextDeadline: toDateInputValue(row.nextDeadline),
    defenceDate: toDateInputValue(row.defenceDate),
    startDateFmt: formatDate(row.startDate),
    nextDeadlineFmt: formatDate(row.nextDeadline),
    defenceDateFmt: formatDate(row.defenceDate),

    status: computeHealthStatus(row.nextDeadline, isTerminal, now),
    notes: row.notes,

    nextStageId: nextStage?.id ?? null,
    nextStageName: nextStage?.name ?? null,

    payments: row.payments.map((p) => ({
      id: p.id,
      amountMinor: p.amountMinor,
      amountFmt: formatMoney(p.amountMinor, currency),
      date: toDateInputValue(p.date),
      dateFmt: formatDate(p.date),
      method: p.method,
      note: p.note,
    })),
  };
}

export async function listProjects(
  orderedStages: { id: string; name: string }[],
  currency: CurrencySettings,
  now: Date = new Date(),
): Promise<ProjectDTO[]> {
  const rows = await loadRows();
  const stagePosition = new Map(orderedStages.map((s, i) => [s.id, i]));
  return rows
    .map((row) => toDTO(row, orderedStages, currency, now))
    .sort((a, b) => {
      const stageDiff = (stagePosition.get(a.stageId) ?? 0) - (stagePosition.get(b.stageId) ?? 0);
      if (stageDiff !== 0) return stageDiff;
      // Undated projects sort last rather than first.
      return (a.nextDeadline || "9999-99-99").localeCompare(b.nextDeadline || "9999-99-99");
    });
}

/** The four dashboard cards. Completed projects are excluded from all of them. */
export function computeMetrics(
  projects: ProjectDTO[],
  currency: CurrencySettings,
  now: Date = new Date(),
): DashboardMetrics {
  const active = projects.filter((p) => p.status !== "Completed");

  // Overpayments on one project must not cancel out what another client owes.
  const outstandingBalanceMinor = active.reduce((sum, p) => sum + Math.max(0, p.balanceMinor), 0);

  const dueThisWeek = active.filter((p) => {
    const days = daysUntil(parseDateOnly(p.nextDeadline), now);
    return days !== null && days >= 0 && days <= TRACKER_CONFIG.dueThisWeekDays;
  }).length;

  return {
    activeProjects: active.length,
    outstandingBalanceMinor,
    outstandingBalanceFmt: formatMoney(outstandingBalanceMinor, currency),
    dueThisWeek,
    overdue: active.filter((p) => p.status === "Overdue").length,
  };
}

export interface ProjectInput {
  clientName: string;
  clientContact: string;
  projectTitle: string;
  serviceType: string;
  stageId: string;
  /** Major currency units, as typed into the form. */
  totalFee: number;
  startDate: string;
  nextDeadline: string;
  defenceDate: string;
  notes: string;
}

function toWriteData(input: ProjectInput, currency: CurrencySettings) {
  return {
    clientName: input.clientName.trim(),
    clientContact: input.clientContact.trim() || null,
    projectTitle: input.projectTitle.trim(),
    serviceType: input.serviceType,
    stageId: input.stageId,
    totalFeeMinor: toMinor(input.totalFee, currency),
    startDate: parseDateOnly(input.startDate),
    nextDeadline: parseDateOnly(input.nextDeadline),
    defenceDate: parseDateOnly(input.defenceDate),
    notes: input.notes,
  };
}

export async function createProject(input: ProjectInput): Promise<{ id: string }> {
  const ctx = await getActorContext();
  const settings = await getAppSettings();
  const stage = await prisma.stage.findFirst({ where: { id: input.stageId, ...ownerScope(ctx) } });
  if (!stage) throw new NotFoundError("Stage");

  const created = await prisma.project.create({
    data: { ...ownerScope(ctx), ...toWriteData(input, settings.currency) },
    select: { id: true },
  });
  return created;
}

export async function updateProject(id: string, input: Partial<ProjectInput>): Promise<void> {
  const ctx = await getActorContext();
  const settings = await getAppSettings();
  const existing = await prisma.project.findFirst({ where: { id, ...ownerScope(ctx) } });
  if (!existing) throw new NotFoundError();

  if (input.stageId) {
    const stage = await prisma.stage.findFirst({ where: { id: input.stageId, ...ownerScope(ctx) } });
    if (!stage) throw new NotFoundError("Stage");
  }

  // Partial updates (a stage drag, a notes edit) must not clear untouched fields.
  const data: Record<string, unknown> = {};
  if (input.clientName !== undefined) data.clientName = input.clientName.trim();
  if (input.clientContact !== undefined) data.clientContact = input.clientContact.trim() || null;
  if (input.projectTitle !== undefined) data.projectTitle = input.projectTitle.trim();
  if (input.serviceType !== undefined) data.serviceType = input.serviceType;
  if (input.stageId !== undefined) data.stageId = input.stageId;
  if (input.totalFee !== undefined) data.totalFeeMinor = toMinor(input.totalFee, settings.currency);
  if (input.startDate !== undefined) data.startDate = parseDateOnly(input.startDate);
  if (input.nextDeadline !== undefined) data.nextDeadline = parseDateOnly(input.nextDeadline);
  if (input.defenceDate !== undefined) data.defenceDate = parseDateOnly(input.defenceDate);
  if (input.notes !== undefined) data.notes = input.notes;

  await prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: string): Promise<void> {
  const ctx = await getActorContext();
  const existing = await prisma.project.findFirst({ where: { id, ...ownerScope(ctx) } });
  if (!existing) throw new NotFoundError();
  await prisma.project.delete({ where: { id } });
}

export interface PaymentInput {
  /** Major currency units. */
  amount: number;
  date: string;
  method: string;
  note: string;
}

export async function addPayment(projectId: string, input: PaymentInput): Promise<void> {
  const ctx = await getActorContext();
  const settings = await getAppSettings();
  const project = await prisma.project.findFirst({ where: { id: projectId, ...ownerScope(ctx) } });
  if (!project) throw new NotFoundError();

  await prisma.payment.create({
    data: {
      projectId,
      amountMinor: toMinor(input.amount, settings.currency),
      date: parseDateOnly(input.date) ?? new Date(),
      method: input.method,
      note: input.note.trim(),
    },
  });
}

export async function deletePayment(projectId: string, paymentId: string): Promise<void> {
  const ctx = await getActorContext();
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, projectId, project: ownerScope(ctx) },
  });
  if (!payment) throw new NotFoundError("Payment");
  await prisma.payment.delete({ where: { id: paymentId } });
}
