// app/api/fingerprint/[fingerprintId]/route.ts — revoke a single enrolled finger
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { fingerprintId: string } }) {
  try {
    const fingerprint = await prisma.fingerprint.update({
      where: { id: params.fingerprintId },
      data: { status: "REVOKED", revokedAt: new Date() },
    });
    return NextResponse.json({ fingerprint });
  } catch {
    return NextResponse.json({ error: "Could not revoke that fingerprint." }, { status: 500 });
  }
}
