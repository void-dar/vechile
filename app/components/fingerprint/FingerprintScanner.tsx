// components/fingerprint/FingerprintScanner.tsx
"use client";

import { useEffect } from "react";
import { useDigitalPersonaReader } from "@/app/hooks/useDigitalPersonaReader";
import type { CapturedSample } from "@/app/lib/digitalpersona/client";

interface FingerprintScannerProps {
  /** Fired once a usable sample is captured. */
  onCapture: (sample: CapturedSample, quality: number) => void;
  /** Start listening for a scan as soon as the reader is ready. */
  autoStart?: boolean;
  instructions?: string;
}

const STATUS_COPY: Record<string, string> = {
  idle: "Connecting to reader…",
  no_device: "No DigitalPersona 4500 detected. Plug in the reader.",
  ready: "Place your finger on the scanner",
  capturing: "Scanning…",
  sample_captured: "Got it — processing scan",
  error: "Scanner error",
};

export function FingerprintScanner({ onCapture, autoStart = true, instructions }: FingerprintScannerProps) {
  const { status, quality, errorMessage, lastSample, startScan } = useDigitalPersonaReader();

  useEffect(() => {
    if (autoStart && status === "ready") {
      startScan();
    }
  }, [autoStart, status, startScan]);

  useEffect(() => {
    if (status === "sample_captured" && lastSample && quality !== null) {
      onCapture(lastSample, quality);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, lastSample]);

  const scanning = status === "capturing";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex h-32 w-32 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900">
        <FingerprintGlyph active={scanning} success={status === "sample_captured"} />
        {scanning && (
          <span className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 animate-fp-sweep rounded-full bg-cyan-400/80" />
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-slate-200">
          {errorMessage ?? instructions ?? STATUS_COPY[status]}
        </p>
        {quality !== null && status !== "error" && (
          <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                quality < 50 ? "bg-red-400" : quality < 75 ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${quality}%` }}
            />
          </div>
        )}
      </div>

      {status === "no_device" && (
        <button
          onClick={startScan}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
        >
          Retry
        </button>
      )}

      <style jsx global>{`
        @keyframes fp-sweep {
          0% {
            top: 15%;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 85%;
            opacity: 0;
          }
        }
        .animate-fp-sweep {
          animation: fp-sweep 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function FingerprintGlyph({ active, success }: { active: boolean; success: boolean }) {
  const color = success ? "#34d399" : active ? "#22d3ee" : "#475569";
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
      <path
        d="M12 11a3 3 0 0 1 3 3v1a7 7 0 0 1-1 3.5M9 17a5 5 0 0 1-1-3v-1a4 4 0 0 1 8 0"
        strokeLinecap="round"
      />
      <path d="M6 15v-1a6 6 0 0 1 10.5-4" strokeLinecap="round" />
      <path d="M4.5 12.5V11a7.5 7.5 0 0 1 13-5" strokeLinecap="round" />
      <path d="M14 20.5c.3-.7.5-1.5.5-2.5v-3a2.5 2.5 0 0 0-5 0" strokeLinecap="round" />
    </svg>
  );
}
