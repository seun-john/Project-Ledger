import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { NotFoundError } from "@/lib/server/projects";
import { LastStageError, StageInUseError } from "@/lib/server/stages";

/**
 * Turns the errors the service layer throws into responses the UI can show
 * verbatim, so route handlers stay free of try/catch boilerplate.
 */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const message = error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: message || "Invalid input." }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof StageInUseError || error instanceof LastStageError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }

  console.error("[project-tracker] unhandled error:", error);
  return NextResponse.json({ error: "Something went wrong. Check the server log." }, { status: 500 });
}
