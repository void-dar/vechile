// app/api/vehicles/[vehicleId]/access/[accessId]/route.ts — revoke a driver's access
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: { accessId: string } }) {
  try {
    // Revoking access does NOT delete their enrolled fingerprints — it just
    // removes them from this vehicle's candidate list at verify time. Their
    // fingerprints stay enrolled in case they're re-granted access later.
    await prisma.vehicleAccess.delete({ where: { id: params.accessId } });
    return NextResponse.json({ revoked: true });
  } catch {
    return NextResponse.json({ error: "Could not revoke access." }, { status: 500 });
  }
}
