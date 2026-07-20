// prisma/seed.ts
//
// Creates one real Vehicle + one real User (its owner) + the VehicleAccess
// linking them, and prints the IDs to use — run this once per vehicle you
// set up, instead of hand-typing rows into the DB.
//
// Usage:
//   VEHICLE_NAME="Praise's Civic" VEHICLE_VIN="1HGCM82633A004352" \
//   OWNER_NAME="Praise" OWNER_EMAIL="praise@example.com" \
//   npx ts-node prisma/seed.ts
//
// Re-running with the same VIN/email is safe — it upserts rather than
// duplicating.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vehicleName = process.env.VEHICLE_NAME ?? "My Vehicle";
  const vehicleVin = process.env.VEHICLE_VIN;
  const ownerName = process.env.OWNER_NAME ?? "Owner";
  const ownerEmail = process.env.OWNER_EMAIL;

  if (!vehicleVin) throw new Error("Set VEHICLE_VIN before seeding.");
  if (!ownerEmail) throw new Error("Set OWNER_EMAIL before seeding.");

  const vehicle = await prisma.vehicle.upsert({
    where: { vin: vehicleVin },
    update: { name: vehicleName },
    create: { name: vehicleName, vin: vehicleVin },
  });

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: { fullName: ownerName },
    create: { fullName: ownerName, email: ownerEmail },
  });

  await prisma.vehicleAccess.upsert({
    where: { userId_vehicleId: { userId: owner.id, vehicleId: vehicle.id } },
    update: { isOwner: true },
    create: { userId: owner.id, vehicleId: vehicle.id, isOwner: true },
  });

  console.log("\nSeeded successfully. Real IDs:\n");
  console.log(`  VEHICLE_ID = ${vehicle.id}`);
  console.log(`  OWNER_USER_ID = ${owner.id}\n`);
  console.log("Put VEHICLE_ID in your .env as shown in the README, then");
  console.log("re-run this script (with a different OWNER_*) for each");
  console.log("additional driver you want authorized on the same vehicle —");
  console.log("just reuse the same VEHICLE_VIN.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
