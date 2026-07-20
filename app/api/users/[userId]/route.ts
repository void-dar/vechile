// app/api/users/[userId]/route.ts — read/update/delete one user
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/prisma";

export async function GET(_req: NextRequest, { params }: { params: { userId: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      vehicles: { include: { vehicle: { select: { id: true, name: true } } } },
      fingerprints: { where: { status: "ENROLLED" }, select: { id: true, finger: true, label: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  let body: { fullName?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({ where: { id: params.userId }, data: body });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Could not update the user." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Cascades to their VehicleAccess and Fingerprint rows per schema.
    await prisma.user.delete({ where: { id: params.userId } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the user." }, { status: 500 });
  }
}
