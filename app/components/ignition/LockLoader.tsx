// components/ignition/LockLoader.tsx
"use client";

export type LockLoaderState = "locked" | "unlocking" | "unlocked" | "denied";

interface LockLoaderProps {
  state: LockLoaderState;
  size?: number;
  label?: string;
}

/**
 * A padlock that doubles as a loading indicator:
 *  - locked:    shackle down, subtle idle pulse (waiting for a scan)
 *  - unlocking: shackle mid-swing, spinning dashes orbiting the body (working)
 *  - unlocked:  shackle popped open, brief glow (success)
 *  - denied:    shackle shakes side to side (rejected)
 */
export function LockLoader({ state, size = 96, label }: LockLoaderProps) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className={[
          "overflow-visible",
          state === "denied" ? "animate-lock-shake" : "",
        ].join(" ")}
      >
        {/* orbiting progress dashes, only visible while working */}
        {state === "unlocking" && (
          <circle
            cx="50"
            cy="58"
            r="38"
            fill="none"
            stroke="var(--lock-accent, #22d3ee)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="12 14"
            className="animate-lock-orbit"
            opacity={0.7}
          />
        )}

        {/* idle pulse ring while waiting */}
        {state === "locked" && (
          <circle
            cx="50"
            cy="58"
            r="34"
            fill="none"
            stroke="var(--lock-idle, #475569)"
            strokeWidth="2"
            className="animate-lock-pulse"
          />
        )}

        {/* success glow ring */}
        {state === "unlocked" && (
          <circle
            cx="50"
            cy="58"
            r="36"
            fill="none"
            stroke="var(--lock-success, #34d399)"
            strokeWidth="2"
            className="animate-lock-glow"
          />
        )}

        {/* shackle */}
        <path
          d={
            state === "unlocking" || state === "unlocked"
              ? "M32 44 V32 a18 18 0 0 1 36 0" // popped open (swung away from body)
              : "M32 44 V32 a18 18 0 0 1 36 0 V44" // closed
          }
          fill="none"
          stroke={
            state === "denied"
              ? "#f87171"
              : state === "unlocked"
              ? "#34d399"
              : "#e2e8f0"
          }
          strokeWidth="7"
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />

        {/* body */}
        <rect
          x="22"
          y="44"
          width="56"
          height="42"
          rx="8"
          fill={state === "denied" ? "#7f1d1d" : "#1e293b"}
          stroke={state === "denied" ? "#f87171" : "#334155"}
          strokeWidth="2"
        />

        {/* keyhole */}
        <circle cx="50" cy="62" r="5" fill={state === "denied" ? "#fecaca" : "#94a3b8"} />
        <rect x="47.5" y="65" width="5" height="10" rx="2" fill={state === "denied" ? "#fecaca" : "#94a3b8"} />
      </svg>

      {label && (
        <span className="text-xs font-medium tracking-wide text-slate-400">{label}</span>
      )}

      <style jsx global>{`
        @keyframes lock-orbit {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-lock-orbit {
          transform-origin: 50px 58px;
          animation: lock-orbit 1.1s linear infinite;
        }

        @keyframes lock-pulse {
          0%,
          100% {
            opacity: 0.35;
            r: 30;
          }
          50% {
            opacity: 0.05;
            r: 38;
          }
        }
        .animate-lock-pulse {
          animation: lock-pulse 2.2s ease-in-out infinite;
        }

        @keyframes lock-glow {
          0% {
            opacity: 0.9;
            r: 30;
          }
          100% {
            opacity: 0;
            r: 46;
          }
        }
        .animate-lock-glow {
          animation: lock-glow 0.7s ease-out 1;
        }

        @keyframes lock-shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-4px);
          }
          40%,
          80% {
            transform: translateX(4px);
          }
        }
        .animate-lock-shake {
          animation: lock-shake 0.4s ease-in-out 1;
        }
      `}</style>
    </div>
  );
}
