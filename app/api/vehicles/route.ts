// app/api/vehicles/route.ts — list + create vehicles
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/prisma";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      vin: true,
      plateNumber: true,
      createdAt: true,
      _count: { select: { authorizedUsers: true } },
    },
  });
  return NextResponse.json({ vehicles });
}

export async function POST(req: NextRequest) {
  let body: { name: string; vin: string; plateNumber?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, vin, plateNumber } = body;
  if (!name || !vin) {
    return NextResponse.json({ error: "name and vin are required" }, { status: 400 });
  }

  try {
    const vehicle = await prisma.vehicle.create({ data: { name, vin, plateNumber } });
    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A vehicle with that VIN already exists." }, { status: 409 });
    }
    console.error("Vehicle creation failed", err);
    return NextResponse.json({ error: "Could not create the vehicle." }, { status: 500 });
  }
}
