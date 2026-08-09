import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { createProject, listProjects } from "@/lib/server/projects";
import { listStages } from "@/lib/server/stages";
import { projectCreateSchema } from "@/lib/validation";
import { getAppSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stages = await listStages();
    const settings = await getAppSettings();
    return NextResponse.json({ projects: await listProjects(stages, settings.currency) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const input = projectCreateSchema.parse(await request.json());
    const created = await createProject(input);
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
