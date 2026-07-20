// hooks/useDigitalPersonaReader.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dpClient, type CapturedSample } from "@/app/lib/digitalpersona/client";

export type ReaderStatus =
  | "idle"
  | "no_device"
  | "ready"
  | "capturing"
  | "sample_captured"
  | "error";

interface UseDigitalPersonaReaderResult {
  status: ReaderStatus;
  quality: number | null;
  errorMessage: string | null;
  lastSample: CapturedSample | null;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  reset: () => void;
}

/**
 * Wraps the DigitalPersona 4500 reader lifecycle for a single scan.
 * Consumers call `startScan()`, watch `status` flip to "sample_captured",
 * then read `lastSample` and send it to the backend for enrollment or
 * comparison. The hook auto-stops acquisition once a sample lands, since
 * we only need one clean sample per attempt.
 */
export function useDigitalPersonaReader(): UseDigitalPersonaReaderResult {
  const [status, setStatus] = useState<ReaderStatus>("idle");
  const [quality, setQuality] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSample, setLastSample] = useState<CapturedSample | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    dpClient.init();

    const offDevice = dpClient.onDeviceChange(({ connected }) => {
      setStatus((prev) => (connected ? "ready" : "no_device"));
    });
    const offError = dpClient.onError((msg) => {
      setErrorMessage(msg);
      setStatus("error");
    });
    const offQuality = dpClient.onQuality((q) => setQuality(q));
    const offSample = dpClient.onSample((sample) => {
      setLastSample(sample);
      setStatus("sample_captured");
      dpClient.stopCapture().catch(() => {});
    });

    return () => {
      offDevice();
      offError();
      offQuality();
      offSample();
    };
  }, []);

  const startScan = useCallback(async () => {
    setErrorMessage(null);
    setLastSample(null);
    setQuality(null);
    setStatus("capturing");
    try {
      await dpClient.startCapture();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to start the scanner.");
      setStatus("error");
    }
  }, []);

  const stopScan = useCallback(async () => {
    await dpClient.stopCapture();
    setStatus("ready");
  }, []);

  const reset = useCallback(() => {
    setStatus("ready");
    setQuality(null);
    setErrorMessage(null);
    setLastSample(null);
  }, []);

  return { status, quality, errorMessage, lastSample, startScan, stopScan, reset };
}
