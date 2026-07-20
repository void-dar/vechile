// app/api/vehicles/[vehicleId]/logs/route.ts — ignition attempt audit trail
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { vehicleId: string } }) {
  const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);

  const logs = await prisma.ignitionLog.findMany({
    where: { vehicleId: params.vehicleId },
    orderBy: { attemptedAt: "desc" },
    take: Math.min(limit, 200),
    include: { user: { select: { fullName: true } } },
  });

  return NextResponse.json({ logs });
}
