import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { getAppSettings, saveAppSettings } from "@/lib/server/settings";
import { settingsSaveSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ settings: await getAppSettings() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const input = settingsSaveSchema.parse(await request.json());
    return NextResponse.json({ settings: await saveAppSettings(input) });
  } catch (error) {
    return errorResponse(error);
  }
}
