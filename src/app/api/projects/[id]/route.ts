import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { deleteProject, updateProject } from "@/lib/server/projects";
import { projectUpdateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = projectUpdateSchema.parse(await request.json());
    await updateProject(id, input);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
