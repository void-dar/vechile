// components/fingerprint/EnrollSetup.tsx
"use client";

import { useState } from "react";
import { FingerprintEnrollment } from "./FingerprintEnrollment";

interface Driver {
  id: string;
  fullName: string;
  email: string;
}

interface EnrollSetupProps {
  vehicleId: string;
  vehicleName: string;
  drivers: Driver[];
}

/**
 * Picks which authorized driver is currently at the reader, then hands off
 * to FingerprintEnrollment with their real userId. There's no auth system
 * yet (see README), so this is a simple picker rather than reading a
 * logged-in session — swap it out once you have real auth.
 */
export function EnrollSetup({ vehicleId, vehicleName, drivers }: EnrollSetupProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    drivers.length === 1 ? drivers[0].id : null
  );

  if (!drivers.length) {
    return (
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-amber-900/60 bg-amber-950/30 p-6 text-center">
        <p className="text-sm font-medium text-amber-300">
          No one is authorized on {vehicleName} yet.
        </p>
        <p className="mt-2 text-xs text-amber-400/80">
          Run <code>prisma/seed.ts</code> for each driver (same VEHICLE_VIN,
          different OWNER_EMAIL) before enrolling fingerprints.
        </p>
      </div>
    );
  }

  if (!selectedUserId) {
    return (
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <h2 className="text-center text-base font-semibold text-slate-100">Who's enrolling?</h2>
        <p className="mt-1 text-center text-xs text-slate-500">Authorized drivers on {vehicleName}</p>

        <div className="mt-5 space-y-2">
          {drivers.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedUserId(d.id)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-cyan-500/60 hover:bg-slate-800"
            >
              <div className="font-medium">{d.fullName}</div>
              <div className="text-xs text-slate-500">{d.email}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <FingerprintEnrollment userId={selectedUserId} vehicleId={vehicleId} />
      <button
        onClick={() => setSelectedUserId(null)}
        className="mx-auto block text-center text-xs text-slate-500 hover:text-slate-300"
      >
        ← not {drivers.find((d) => d.id === selectedUserId)?.fullName}? choose again
      </button>
    </div>
  );
}
