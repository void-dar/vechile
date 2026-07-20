"use client";

import { useState } from "react";
import Link from "next/link";
import { Prisma } from "@prisma/client";

type VehicleWithUsers = Prisma.VehicleGetPayload<{
  include: {
    authorizedUsers: {
      include: {
        user: {
          select: {
            id: true;
            fullName: true;
            email: true;
            fingerprints: {
              where: { status: "ENROLLED" };
              select: {
                id: true;
                finger: true;
                label: true;
                createdAt: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type LogEntry = {
  id: string;
  result: string;
  attemptedAt: Date;
  user: {
    fullName: string;
  } | null;
};

interface VehicleDetailProps {
  vehicle: VehicleWithUsers;
  allUsers: {
    id: string;
    fullName: string;
    email: string;
  }[];
  logs: LogEntry[];
}

export function VehicleDetail({
  vehicle,
  allUsers,
  logs,
}: VehicleDetailProps) {
  const [drivers, setDrivers] = useState(vehicle.authorizedUsers);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const unassignedUsers = allUsers.filter(
    (u) => !drivers.some((d) => d.user.id === u.id)
  );

  const grantAccess = async () => {
    if (!selectedUserId) return;

    setError(null);

    const res = await fetch(`/api/vehicles/${vehicle.id}/access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: selectedUserId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Could not grant access.");
      return;
    }

    const user = allUsers.find((u) => u.id === selectedUserId)!;

    setDrivers((prev) => [
      ...prev,
      {
        id: data.access.id,
        userId: user.id,
        vehicleId: vehicle.id,
        createdAt: new Date(),
        isOwner: false,
        user: {
          ...user,
          fingerprints: [],
        },
      },
    ]);

    setSelectedUserId("");
  };

  const revokeAccess = async (accessId: string) => {
    const res = await fetch(
      `/api/vehicles/${vehicle.id}/access/${accessId}`,
      {
        method: "DELETE",
      }
    );

    if (res.ok) {
      setDrivers((prev) => prev.filter((d) => d.id !== accessId));
    }
  };

  const revokeFingerprint = async (
    fingerprintId: string,
    driverAccessId: string
  ) => {
    const res = await fetch(`/api/fingerprint/${fingerprintId}`, {
      method: "DELETE",
    });

    if (!res.ok) return;

    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverAccessId
          ? {
              ...d,
              user: {
                ...d.user,
                fingerprints: d.user.fingerprints.filter(
                  (f) => f.id !== fingerprintId
                ),
              },
            }
          : d
      )
    );
  };

  return (
    <div>
      <Link
        href="/admin"
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        ← all vehicles
      </Link>

      <h1 className="mt-2 text-lg font-semibold text-slate-100">
        {vehicle.name}
      </h1>

      <p className="text-xs text-slate-500">{vehicle.vin}</p>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Authorized drivers
        </h2>

        <div className="mt-3 flex gap-2">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Grant access to…</option>

            {unassignedUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName} ({u.email})
              </option>
            ))}
          </select>

          <button
            onClick={grantAccess}
            disabled={!selectedUserId}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            Grant
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {drivers.length === 0 && (
            <p className="text-sm text-slate-500">
              No one's authorized yet.
            </p>
          )}

          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {driver.user.fullName}{" "}
                    {driver.isOwner && (
                      <span className="text-cyan-400">(owner)</span>
                    )}
                  </p>

                  <p className="text-xs text-slate-500">
                    {driver.user.email}
                  </p>
                </div>

                <button
                  onClick={() => revokeAccess(driver.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Revoke access
                </button>
              </div>

              {driver.user.fingerprints.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-slate-800 pt-3">
                  {driver.user.fingerprints.map((finger) => (
                    <div
                      key={finger.id}
                      className="flex items-center justify-between text-xs text-slate-400"
                    >
                      <span>{finger.label ?? finger.finger}</span>

                      <button
                        onClick={() =>
                          revokeFingerprint(finger.id, driver.id)
                        }
                        className="text-slate-600 hover:text-red-400"
                      >
                        Revoke finger
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Recent ignition attempts
        </h2>

        <div className="mt-3 divide-y divide-slate-800 rounded-xl border border-slate-800">
          {logs.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              No attempts logged yet.
            </p>
          )}

          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between px-4 py-2 text-xs"
            >
              <span
                className={
                  log.result === "SUCCESS"
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              >
                {log.result}
              </span>

              <span className="text-slate-500">
                {log.user?.fullName ?? "—"}
              </span>

              <span className="text-slate-600">
                {log.attemptedAt.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}