/*
  Warnings:

  - You are about to drop the `Response` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "FingerScanStatus" AS ENUM ('ENROLLED', 'REVOKED');

-- CreateEnum
CREATE TYPE "IgnitionResult" AS ENUM ('SUCCESS', 'NO_MATCH', 'LOCKED_OUT', 'DEVICE_ERROR', 'LOW_QUALITY_SCAN');

-- DropTable
DROP TABLE "Response";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "plateNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "isOwner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fingerprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "finger" TEXT NOT NULL,
    "label" TEXT,
    "templateData" TEXT NOT NULL,
    "templateFormat" TEXT NOT NULL DEFAULT 'ISO_19794_2',
    "quality" INTEGER NOT NULL,
    "status" "FingerScanStatus" NOT NULL DEFAULT 'ENROLLED',
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Fingerprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IgnitionLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT,
    "fingerprintId" TEXT,
    "result" "IgnitionResult" NOT NULL,
    "matchScore" INTEGER,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT,

    CONSTRAINT "IgnitionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vin_key" ON "Vehicle"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleAccess_userId_vehicleId_key" ON "VehicleAccess"("userId", "vehicleId");

-- CreateIndex
CREATE INDEX "Fingerprint_userId_idx" ON "Fingerprint"("userId");

-- CreateIndex
CREATE INDEX "IgnitionLog_vehicleId_attemptedAt_idx" ON "IgnitionLog"("vehicleId", "attemptedAt");

-- AddForeignKey
ALTER TABLE "VehicleAccess" ADD CONSTRAINT "VehicleAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAccess" ADD CONSTRAINT "VehicleAccess_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fingerprint" ADD CONSTRAINT "Fingerprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgnitionLog" ADD CONSTRAINT "IgnitionLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgnitionLog" ADD CONSTRAINT "IgnitionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IgnitionLog" ADD CONSTRAINT "IgnitionLog_fingerprintId_fkey" FOREIGN KEY ("fingerprintId") REFERENCES "Fingerprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
