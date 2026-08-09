import { TRACKER_CONFIG } from "@/config/tracker.config";
import { prisma } from "@/lib/prisma";
import { getActorContext, ownerScope } from "@/lib/tenancy";
import type { StageDTO } from "@/lib/types";

export class StageInUseError extends Error {
  constructor(public stageName: string, public projectCount: number) {
    super(
      `"${stageName}" still has ${projectCount} project(s) in it. Move or delete those projects before removing this stage.`,
    );
    this.name = "StageInUseError";
  }
}

export class LastStageError extends Error {
  constructor() {
    super("A pipeline needs at least one stage.");
    this.name = "LastStageError";
  }
}

/**
 * Loads the pipeline, seeding it from TRACKER_CONFIG.defaultStages the first
 * time the app runs against an empty database.
 */
export async function listStages(): Promise<StageDTO[]> {
  const ctx = await getActorContext();
  const scope = ownerScope(ctx);

  let stages = await prisma.stage.findMany({
    where: scope,
    orderBy: { position: "asc" },
    include: { _count: { select: { projects: true } } },
  });

  if (stages.length === 0) {
    await prisma.stage.createMany({
      data: TRACKER_CONFIG.defaultStages.map((name, position) => ({ ...scope, name, position })),
    });
    stages = await prisma.stage.findMany({
      where: scope,
      orderBy: { position: "asc" },
      include: { _count: { select: { projects: true } } },
    });
  }

  return stages.map((stage, index) => ({
    id: stage.id,
    name: stage.name,
    position: stage.position,
    isTerminal: index === stages.length - 1,
    projectCount: stage._count.projects,
  }));
}

export interface StageInput {
  /** Omitted for stages being added. */
  id?: string;
  name: string;
}

/**
 * Replaces the whole pipeline in one transaction: renames keep their id (so the
 * projects sitting in them follow along), order is taken from array position,
 * and stages dropped from the list are deleted only if they are empty.
 */
export async function saveStages(input: StageInput[]): Promise<StageDTO[]> {
  const ctx = await getActorContext();
  const scope = ownerScope(ctx);

  const named = input
    .map((s) => ({ id: s.id, name: s.name.trim() }))
    .filter((s) => s.name.length > 0);

  if (named.length === 0) throw new LastStageError();

  const existing = await prisma.stage.findMany({
    where: scope,
    include: { _count: { select: { projects: true } } },
  });

  const keptIds = new Set(named.map((s) => s.id).filter(Boolean) as string[]);
  const removed = existing.filter((stage) => !keptIds.has(stage.id));

  const blocked = removed.find((stage) => stage._count.projects > 0);
  if (blocked) throw new StageInUseError(blocked.name, blocked._count.projects);

  await prisma.$transaction(async (tx) => {
    if (removed.length > 0) {
      await tx.stage.deleteMany({ where: { id: { in: removed.map((s) => s.id) } } });
    }

    // Park everything on temporary positions first: `position` is not unique, but
    // shuffling in place would otherwise leave two stages briefly claiming the
    // same slot and produce a confusing intermediate order.
    for (const [index, stage] of named.entries()) {
      if (stage.id) {
        await tx.stage.update({
          where: { id: stage.id },
          data: { name: stage.name, position: -1 - index },
        });
      }
    }

    for (const [index, stage] of named.entries()) {
      if (stage.id) {
        await tx.stage.update({ where: { id: stage.id }, data: { position: index } });
      } else {
        await tx.stage.create({ data: { ...scope, name: stage.name, position: index } });
      }
    }
  });

  return listStages();
}
