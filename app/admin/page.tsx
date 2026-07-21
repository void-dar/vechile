import { AdminDashboard } from "@/app/components/admin/AdminDashboard";
import prisma from "@/app/api/prisma";

export default async function AdminPage() {
  const [vehicles, users] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, vin: true, _count: { select: { authorizedUsers: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, fullName: true, email: true, _count: { select: { fingerprints: true, vehicles: true } } },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-lg font-semibold text-slate-100">Fleet admin</h1>
        <p className="mt-1 text-sm text-slate-500">Manage vehicles, drivers, and whos authorized on what.</p>
        <AdminDashboard initialVehicles={vehicles} initialUsers={users} />
      </div>
    </main>
  );
}
