// app/api/vehicles/[vehicleId]/access/route.ts — grant a user access to a vehicle
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/prisma";

export async function POST(req: NextRequest, { params }: { params: { vehicleId: string } }) {
  let body: { userId: string; isOwner?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const access = await prisma.vehicleAccess.upsert({
      where: { userId_vehicleId: { userId: body.userId, vehicleId: params.vehicleId } },
      update: { isOwner: body.isOwner ?? false },
      create: { userId: body.userId, vehicleId: params.vehicleId, isOwner: body.isOwner ?? false },
    });
    return NextResponse.json({ access }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2003") {
      return NextResponse.json({ error: "That user or vehicle doesn't exist." }, { status: 404 });
    }
    console.error("Granting access failed", err);
    return NextResponse.json({ error: "Could not grant access." }, { status: 500 });
  }
}
