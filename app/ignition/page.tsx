// app/ignition/page.tsx
import prisma from "../api/prisma";
import { IgnitionPanel } from "../components/ignition/IgnitionPanel";

// One physical ignition console = one vehicle. Set this once per install
// (get the value from `npx ts-node prisma/seed.ts`, see README).
const VEHICLE_ID = process.env.VEHICLE_ID;

export default async function IgnitionPage() {
  if (!VEHICLE_ID) {
    return (
      <ConfigError message="VEHICLE_ID isn't set. Add it to .env — run prisma/seed.ts to get a real ID." />
    );
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: VEHICLE_ID } });

  if (!vehicle) {
    return (
      <ConfigError message={`No vehicle found for VEHICLE_ID="${VEHICLE_ID}". Check it's a real ID from prisma/seed.ts.`} />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <IgnitionPanel vehicleId={vehicle.id} vehicleName={vehicle.name} />
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
