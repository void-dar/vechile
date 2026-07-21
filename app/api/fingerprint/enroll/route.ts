// app/api/fingerprint/enroll/route.ts
import { NextRequest, NextResponse } from "next/server";
import { encryptTemplate } from "@/app/lib/crypto";
import prisma from "@/app/api/prisma";

interface EnrollBody {
  userId: string;
  vehicleId: string;
  finger: string; // e.g. "RIGHT_INDEX"
  label?: string;
  template: string; // base64 FMD from the reader
  quality: number;
  deviceId?: string;
}

const MIN_ENROLL_QUALITY = 60;

export async function POST(req: NextRequest) {
  let body: EnrollBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId, vehicleId, finger, label, template, quality, deviceId } = body;

  if (!userId || !vehicleId || !finger || !template || typeof quality !== "number") {
    return NextResponse.json(
      { error: "userId, vehicleId, finger, template, and quality are required" },
      { status: 400 }
    );
  }

  if (quality < MIN_ENROLL_QUALITY) {
    return NextResponse.json(
      { error: `Scan quality too low (${quality}). Ask the user to try again with a cleaner, centered scan.` },
      { status: 422 }
    );
  }

  // Confirm the user is actually authorized on this vehicle before we let
  // them link a finger to it.
  const access = await prisma.vehicleAccess.findUnique({
    where: { userId_vehicleId: { userId, vehicleId } },
  });
  if (!access) {
    return NextResponse.json(
      { error: "This user is not authorized on that vehicle. Grant access before enrolling a finger." },
      { status: 403 }
    );
  }

  try {
    const encrypted = encryptTemplate(template);

    const fingerprint = await prisma.fingerprint.create({
      data: {
        userId,
        finger,
        label,
        templateData: encrypted,
        quality,
        deviceId,
      },
      select: { id: true, finger: true, label: true, quality: true, createdAt: true },
    });

    return NextResponse.json({ fingerprint }, { status: 201 });
  } catch (err) {
    console.error("Fingerprint enrollment failed", err);
    return NextResponse.json({ error: "Could not save the fingerprint. Try again." }, { status: 500 });
  }
}

// List a user's enrolled fingers (for the "manage linked fingerprints" UI)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId query param is required" }, { status: 400 });
  }

  const fingerprints = await prisma.fingerprint.findMany({
    where: { userId, status: "ENROLLED" },
    select: { id: true, finger: true, label: true, quality: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ fingerprints });
}
