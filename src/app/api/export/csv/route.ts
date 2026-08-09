import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { projectsToCsv } from "@/lib/csv";
import { listProjects } from "@/lib/server/projects";
import { listStages } from "@/lib/server/stages";
import { toDateInputValue, todayDateOnly } from "@/lib/dates";
import { getAppSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stages = await listStages();
    const settings = await getAppSettings();
    const csv = projectsToCsv(await listProjects(stages, settings.currency), settings.currency);
    const filename = `project-ledger-projects-${toDateInputValue(todayDateOnly())}.csv`;

    // The BOM makes Excel open the file as UTF-8 so symbols and notes survive.
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
