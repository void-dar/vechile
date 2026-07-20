// app/api/vehicles/[vehicleId]/route.ts — read/update/delete one vehicle
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { vehicleId: string } }) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.vehicleId },
    include: {
      authorizedUsers: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              fingerprints: {
                where: { status: "ENROLLED" },
                select: { id: true, finger: true, label: true, createdAt: true },
              },
            },
          },
        },
      },
    },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
  }
  return NextResponse.json({ vehicle });
}

export async function PATCH(req: NextRequest, { params }: { params: { vehicleId: string } }) {
  let body: { name?: string; plateNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: params.vehicleId },
      data: { name: body.name, plateNumber: body.plateNumber },
    });
    return NextResponse.json({ vehicle });
  } catch {
    return NextResponse.json({ error: "Could not update the vehicle." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { vehicleId: string } }) {
  try {
    // Cascades to VehicleAccess and IgnitionLog per schema's onDelete: Cascade.
    await prisma.vehicle.delete({ where: { id: params.vehicleId } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Could not delete the vehicle." }, { status: 500 });
  }
}
