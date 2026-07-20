import prisma from "../api/prisma";
import { EnrollSetup } from "../components/fingerprint/EnrollSetup";

// Same VEHICLE_ID as app/ignition/page.tsx — set once per install.
const VEHICLE_ID = process.env.VEHICLE_ID;

export default async function EnrollPage() {
  if (!VEHICLE_ID) {
    return <ConfigError message="VEHICLE_ID isn't set. Add it to .env — run prisma/seed.ts to get a real ID." />;
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: VEHICLE_ID },
    include: {
      authorizedUsers: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
      },
    },
  });

  if (!vehicle) {
    return (
      <ConfigError message={`No vehicle found for VEHICLE_ID="${VEHICLE_ID}". Check it's a real ID from prisma/seed.ts.`} />
    );
  }

  const drivers = vehicle.authorizedUsers.map((a) => a.user);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <EnrollSetup vehicleId={vehicle.id} vehicleName={vehicle.name} drivers={drivers} />
    </main>
  );
}

function ConfigError({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="max-w-sm rounded-2xl border border-red-900/60 bg-red-950/40 p-6 text-center">
        <p className="text-sm font-medium text-red-300">{message}</p>
      </div>
    </main>
  );
}
