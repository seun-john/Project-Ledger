import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { listStages, saveStages } from "@/lib/server/stages";
import { stagesSaveSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ stages: await listStages() });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Replaces the whole ordered pipeline — the stage editor saves as one unit. */
export async function PUT(request: NextRequest) {
  try {
    const { stages } = stagesSaveSchema.parse(await request.json());
    return NextResponse.json({ stages: await saveStages(stages) });
  } catch (error) {
    return errorResponse(error);
  }
}
