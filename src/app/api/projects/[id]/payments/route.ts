import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { addPayment } from "@/lib/server/projects";
import { paymentCreateSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const input = paymentCreateSchema.parse(await request.json());
    await addPayment(id, input);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
