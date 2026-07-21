// app/page.tsx — the root route, "/"
import Link from "next/link";

const LINKS = [
  { href: "/ignition", label: "Start vehicle", desc: "Scan a fingerprint to start the configured vehicle." },
  { href: "/enroll", label: "Enroll a fingerprint", desc: "Link a driver's finger to the configured vehicle." },
  { href: "/admin", label: "Fleet admin", desc: "Manage vehicles, drivers, and access." },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="text-center text-lg font-semibold text-slate-100">Vehicle Ignition System</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Fingerprint-gated ignition and fleet access.</p>

        <div className="mt-8 space-y-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 transition hover:border-cyan-500/60 hover:bg-slate-800"
            >
              <p className="text-sm font-medium text-slate-200">{l.label}</p>
              <p className="text-xs text-slate-500">{l.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}