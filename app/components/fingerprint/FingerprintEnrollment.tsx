// components/fingerprint/FingerprintEnrollment.tsx
"use client";

import { useState } from "react";
import { FingerprintScanner } from "./FingerprintScanner";
import { LockLoader, type LockLoaderState } from "@/app/components/ignition/LockLoader";
import type { CapturedSample } from "@/app/lib/digitalpersona/client";

const FINGERS = [
  { id: "LEFT_PINKY", label: "Pinky" },
  { id: "LEFT_RING", label: "Ring" },
  { id: "LEFT_MIDDLE", label: "Middle" },
  { id: "LEFT_INDEX", label: "Index" },
  { id: "LEFT_THUMB", label: "Thumb" },
] as const;

const FINGERS_RIGHT = [
  { id: "RIGHT_THUMB", label: "Thumb" },
  { id: "RIGHT_INDEX", label: "Index" },
  { id: "RIGHT_MIDDLE", label: "Middle" },
  { id: "RIGHT_RING", label: "Ring" },
  { id: "RIGHT_PINKY", label: "Pinky" },
] as const;

type Step = "select_finger" | "scan" | "saving" | "done" | "error";

interface FingerprintEnrollmentProps {
  userId: string;
  vehicleId: string;
  onEnrolled?: (fingerprintId: string) => void;
}

export function FingerprintEnrollment({ userId, vehicleId, onEnrolled }: FingerprintEnrollmentProps) {
  const [step, setStep] = useState<Step>("select_finger");
  const [selectedFinger, setSelectedFinger] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFingerSelect = (fingerId: string) => {
    setSelectedFinger(fingerId);
    setStep("scan");
  };

  const handleCapture = async (sample: CapturedSample, quality: number) => {
    if (!selectedFinger) return;
    setStep("saving");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/fingerprint/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          vehicleId,
          finger: selectedFinger,
          template: sample.raw,
          quality,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Enrollment failed.");
        setStep("error");
        return;
      }

      setStep("done");
      onEnrolled?.(data.fingerprint.id);
    } catch {
      setErrorMsg("Couldn't reach the server. Check your connection.");
      setStep("error");
    }
  };

  const loaderState: LockLoaderState =
    step === "saving" ? "unlocking" : step === "done" ? "unlocked" : step === "error" ? "denied" : "locked";

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6">
      <h2 className="text-center text-base font-semibold text-slate-100">Link a fingerprint</h2>
      <p className="mt-1 text-center text-xs text-slate-500">
        Choose which finger, then scan it on the reader to link it to this vehicle.
      </p>

      {step === "select_finger" && (
        <div className="mt-6 space-y-4">
          <HandRow title="Left hand" fingers={FINGERS} onSelect={handleFingerSelect} />
          <HandRow title="Right hand" fingers={FINGERS_RIGHT} onSelect={handleFingerSelect} />
        </div>
      )}

      {step === "scan" && (
        <div className="mt-6">
          <FingerprintScanner
            instructions={`Scan your ${prettify(selectedFinger)} now`}
            onCapture={handleCapture}
          />
          <button
            onClick={() => setStep("select_finger")}
            className="mt-4 w-full text-center text-xs text-slate-500 hover:text-slate-300"
          >
            ← choose a different finger
          </button>
        </div>
      )}

      {(step === "saving" || step === "done" || step === "error") && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <LockLoader
            state={loaderState}
            label={
              step === "saving"
                ? "Linking fingerprint…"
                : step === "done"
                ? "Fingerprint linked"
                : errorMsg ?? "Something went wrong"
            }
          />
          {step !== "saving" && (
            <button
              onClick={() => {
                setStep("select_finger");
                setSelectedFinger(null);
              }}
              className="mt-2 rounded-lg border border-slate-700 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              {step === "done" ? "Link another finger" : "Try again"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function HandRow({
  title,
  fingers,
  onSelect,
}: {
  title: string;
  fingers: readonly { id: string; label: string }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="flex justify-between gap-1.5">
        {fingers.map((f) => (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl border border-slate-800 bg-slate-900 py-3 text-[11px] text-slate-300 transition hover:border-cyan-500/60 hover:bg-slate-800 hover:text-cyan-300"
          >
            <FingerTip />
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FingerTip() {
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
      <rect x="1" y="1" width="12" height="18" rx="6" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function prettify(fingerId: string | null) {
  if (!fingerId) return "finger";
  return fingerId.replace("_", " ").toLowerCase();
}
