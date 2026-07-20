// components/ignition/IgnitionPanel.tsx
"use client";

import { useState } from "react";
import { FingerprintScanner } from "@/app/components/fingerprint/FingerprintScanner";
import { LockLoader, type LockLoaderState } from "@/app/components/ignition/LockLoader";
import { useIgnitionSound } from "@/app/hooks/useIgnitionSound";
import type { CapturedSample } from "@/app/lib/digitalpersona/client";

type IgnitionState = "waiting" | "verifying" | "started" | "denied";

interface IgnitionPanelProps {
  vehicleId: string;
  vehicleName?: string;
}

export function IgnitionPanel({ vehicleId, vehicleName = "your vehicle" }: IgnitionPanelProps) {
  const [state, setState] = useState<IgnitionState>("waiting");
  const [message, setMessage] = useState<string | null>(null);
  const { playStart, playDenied, playScanBeep } = useIgnitionSound();

  const handleCapture = async (sample: CapturedSample, quality: number) => {
    playScanBeep();
    setState("verifying");
    setMessage(null);

    try {
      const res = await fetch("/api/fingerprint/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, template: sample.raw, quality }),
      });
      const data = await res.json();

      if (res.ok && data.authorized) {
        setState("started");
        playStart();
      } else {
        setState("denied");
        setMessage(data.message ?? "Fingerprint not recognized.");
        playDenied();
      }
    } catch {
      setState("denied");
      setMessage("Couldn't reach the vehicle system. Try again.");
      playDenied();
    }
  };

  const reset = () => {
    setState("waiting");
    setMessage(null);
  };

  const loaderState: LockLoaderState =
    state === "verifying" ? "unlocking" : state === "started" ? "unlocked" : state === "denied" ? "denied" : "locked";

  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-950 to-slate-900 p-8 text-center shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ignition</p>
      <h1 className="mt-1 text-lg font-semibold text-slate-100">{vehicleName}</h1>

      <div className="mt-8 flex flex-col items-center gap-6">
        <LockLoader
          state={loaderState}
          size={110}
          label={
            state === "waiting"
              ? undefined
              : state === "verifying"
              ? "Verifying fingerprint…"
              : state === "started"
              ? "Engine started"
              : message ?? "Access denied"
          }
        />

        {(state === "waiting" || state === "verifying") && (
          <FingerprintScanner onCapture={handleCapture} instructions="Scan your finger to start the engine" />
        )}

        {(state === "started" || state === "denied") && (
          <button
            onClick={reset}
            className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            {state === "started" ? "Scan again" : "Try again"}
          </button>
        )}
      </div>
    </div>
  );
}
