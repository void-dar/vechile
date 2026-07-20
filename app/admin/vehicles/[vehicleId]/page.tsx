// app/admin/vehicles/[vehicleId]/page.tsx
import { notFound } from "next/navigation";
import { VehicleDetail } from "@/app/components/admin/VehicleDetail";
import prisma from "@/app/api/prisma";

export default async function VehicleDetailPage({ params }: { params: { vehicleId: string } }) {
  const [vehicle, allUsers, logs] = await Promise.all([
    prisma.vehicle.findUnique({
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
    }),
    prisma.user.findMany({ orderBy: { fullName: "asc" }, select: { id: true, fullName: true, email: true } }),
    prisma.ignitionLog.findMany({
      where: { vehicleId: params.vehicleId },
      orderBy: { attemptedAt: "desc" },
      take: 25,
      include: { user: { select: { fullName: true } } },
    }),
  ]);

  if (!vehicle) notFound();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <VehicleDetail vehicle={vehicle} allUsers={allUsers} logs={logs} />
      </div>
    </main>
  );
}
