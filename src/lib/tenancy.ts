/**
 * The auth seam (spec §7).
 *
 * v1 is a single-user local app: there is one implicit owner and `ownerId` is
 * null on every row. Every read and write in src/lib/server/* goes through
 * `getActorContext()` and scopes its queries with `ownerScope()`, so adding
 * accounts later means changing this file — resolve the session, return the
 * real user id — rather than rewriting the data access layer.
 */

export interface ActorContext {
  /** Null in v1 = the single local owner. */
  ownerId: string | null;
}

export async function getActorContext(): Promise<ActorContext> {
  return { ownerId: null };
}

/** Spread into any Prisma `where` clause to keep it scoped to the current owner. */
export function ownerScope(ctx: ActorContext): { ownerId: string | null } {
  return { ownerId: ctx.ownerId };
}
