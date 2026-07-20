// components/admin/AdminDashboard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface VehicleRow {
  id: string;
  name: string;
  vin: string;
  _count: { authorizedUsers: number };
}

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  _count: { fingerprints: number; vehicles: number };
}

interface AdminDashboardProps {
  initialVehicles: VehicleRow[];
  initialUsers: UserRow[];
}

export function AdminDashboard({ initialVehicles, initialUsers }: AdminDashboardProps) {
  const [tab, setTab] = useState<"vehicles" | "users">("vehicles");
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [users, setUsers] = useState(initialUsers);

  return (
    <div className="mt-8">
      <div className="flex gap-1 border-b border-slate-800">
        {(["vehicles", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition ${
              tab === t ? "border-b-2 border-cyan-400 text-slate-100" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "vehicles" && <VehiclesTab vehicles={vehicles} onCreated={(v) => setVehicles((prev) => [v, ...prev])} />}
      {tab === "users" && <UsersTab users={users} onCreated={(u) => setUsers((prev) => [u, ...prev])} />}
    </div>
  );
}

function VehiclesTab({
  vehicles,
  onCreated,
}: {
  vehicles: VehicleRow[];
  onCreated: (v: VehicleRow) => void;
}) {
  const [name, setName] = useState("");
  const [vin, setVin] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, vin, plateNumber: plateNumber || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add vehicle.");
        return;
      }
      onCreated({ ...data.vehicle, _count: { authorizedUsers: 0 } });
      setName("");
      setVin("");
      setPlateNumber("");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={submit} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Add a vehicle</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Praise's Civic)"
            required
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          />
          <input
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            placeholder="VIN"
            required
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          />
          <input
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            placeholder="Plate number (optional)"
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add vehicle"}
        </button>
      </form>

      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">
        {vehicles.length === 0 && <p className="p-4 text-sm text-slate-500">No vehicles yet.</p>}
        {vehicles.map((v) => (
          <Link
            key={v.id}
            href={`/admin/vehicles/${v.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-900"
          >
            <div>
              <p className="text-sm font-medium text-slate-200">{v.name}</p>
              <p className="text-xs text-slate-500">{v.vin}</p>
            </div>
            <span className="text-xs text-slate-500">{v._count.authorizedUsers} driver(s)</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function UsersTab({ users, onCreated }: { users: UserRow[]; onCreated: (u: UserRow) => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not add user.");
        return;
      }
      onCreated({ ...data.user, _count: { fingerprints: 0, vehicles: 0 } });
      setFullName("");
      setEmail("");
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <form onSubmit={submit} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Add a person</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
          />
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-3 rounded-lg bg-cyan-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add person"}
        </button>
      </form>

      <div className="divide-y divide-slate-800 rounded-xl border border-slate-800">
        {users.length === 0 && <p className="p-4 text-sm text-slate-500">No one added yet.</p>}
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-200">{u.fullName}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>
            <span className="text-xs text-slate-500">
              {u._count.vehicles} vehicle(s) · {u._count.fingerprints} finger(s)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
