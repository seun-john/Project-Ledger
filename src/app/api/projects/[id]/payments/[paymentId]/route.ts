import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/api";
import { deletePayment } from "@/lib/server/projects";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> },
) {
  try {
    const { id, paymentId } = await params;
    await deletePayment(id, paymentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
