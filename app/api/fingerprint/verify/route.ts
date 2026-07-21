// app/api/fingerprint/verify/route.ts
//
// Called from the ignition screen once the reader captures a live sample.
// Compares it against every active fingerprint linked to the vehicle,
// logs the attempt either way, and tells the frontend whether to fire the
// ignition sequence.

import { NextRequest, NextResponse } from "next/server";
import { decryptTemplate } from "@/app/lib/crypto";
import { matchFingerprint } from "@/app/lib/digitalpersona/matcher";
import prisma from "@/app/api/prisma";

interface VerifyBody {
  vehicleId: string;
  template: string; // base64 FMD just captured
  quality: number;
  deviceId?: string;
}

const MIN_SCAN_QUALITY = 50;
const MAX_ATTEMPTS_PER_MINUTE = 5;

export async function POST(req: NextRequest) {
  let body: VerifyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { vehicleId, template, quality, deviceId } = body;
  if (!vehicleId || !template || typeof quality !== "number") {
    return NextResponse.json(
      { error: "vehicleId, template, and quality are required" },
      { status: 400 }
    );
  }

  // Basic lockout: too many failed attempts in a short window blocks
  // further tries so a stolen/borrowed reader can't brute force scans.
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recentAttempts = await prisma.ignitionLog.count({
    where: { vehicleId, attemptedAt: { gte: oneMinuteAgo } },
  });
  if (recentAttempts >= MAX_ATTEMPTS_PER_MINUTE) {
    await prisma.ignitionLog.create({
      data: { vehicleId, result: "LOCKED_OUT", deviceId },
    });
    return NextResponse.json(
      { authorized: false, reason: "LOCKED_OUT", message: "Too many attempts. Wait a minute and try again." },
      { status: 429 }
    );
  }

  if (quality < MIN_SCAN_QUALITY) {
    await prisma.ignitionLog.create({
      data: { vehicleId, result: "LOW_QUALITY_SCAN", deviceId },
    });
    return NextResponse.json(
      { authorized: false, reason: "LOW_QUALITY_SCAN", message: "Scan was unclear. Try again." },
      { status: 422 }
    );
  }

  // Pull every active fingerprint for anyone with access to this vehicle.
  const candidates = await prisma.fingerprint.findMany({
    where: {
      status: "ENROLLED",
      user: { vehicles: { some: { vehicleId } } },
    },
    select: { id: true, userId: true, templateData: true },
  });

  if (!candidates.length) {
    return NextResponse.json(
      { authorized: false, reason: "NO_MATCH", message: "No fingerprints are enrolled for this vehicle yet." },
      { status: 200 }
    );
  }

  try {
    const decryptedCandidates = candidates.map((c) => ({
      fingerprintId: c.id,
      template: decryptTemplate(c.templateData),
    }));

    const { matchedFingerprintId, score } = await matchFingerprint({
      probeTemplate: template,
      candidateTemplates: decryptedCandidates,
    });

    if (!matchedFingerprintId) {
      await prisma.ignitionLog.create({
        data: { vehicleId, result: "NO_MATCH", matchScore: score, deviceId },
      });
      return NextResponse.json(
        { authorized: false, reason: "NO_MATCH", message: "Fingerprint not recognized." },
        { status: 200 }
      );
    }

    const matched = candidates.find((c) => c.id === matchedFingerprintId)!;

    await prisma.ignitionLog.create({
      data: {
        vehicleId,
        userId: matched.userId,
        fingerprintId: matched.id,
        result: "SUCCESS",
        matchScore: score,
        deviceId,
      },
    });

    return NextResponse.json({
      authorized: true,
      reason: "SUCCESS",
      userId: matched.userId,
      score,
    });
  } catch (err) {
    console.error("Fingerprint verification failed", err);
    await prisma.ignitionLog.create({
      data: { vehicleId, result: "DEVICE_ERROR", deviceId },
    });
    return NextResponse.json(
      { authorized: false, reason: "DEVICE_ERROR", message: "Something went wrong reading the scan. Try again." },
      { status: 500 }
    );
  }
}
