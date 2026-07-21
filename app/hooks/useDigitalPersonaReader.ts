/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useDigitalPersonaReader.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dpClient, type CapturedSample } from "@/app/lib/digitalpersona/client";
import { QualityCode, isGoodQuality } from "@/app/lib/digitalpersona/quality";

export type ReaderStatus =
  | "sdk_loading"
  | "no_device"
  | "ready"
  | "capturing"
  | "sample_captured"
  | "error";

interface UseDigitalPersonaReaderResult {
  status: ReaderStatus;
  /** Categorical, not a percentage — see lib/digitalpersona/quality.ts. */
  qualityCode: QualityCode | null;
  errorMessage: string | null;
  lastSample: CapturedSample | null;
  startScan: () => Promise<void>;
  stopScan: () => Promise<void>;
  reset: () => void;
}

const SDK_WAIT_TIMEOUT_MS = 8000;
const SDK_POLL_INTERVAL_MS = 100;

/**
 * Wraps the DigitalPersona 4500 reader lifecycle for a single scan.
 * Consumers call `startScan()`, watch `status` flip to "sample_captured",
 * then read `lastSample` and send it to the backend for enrollment or
 * comparison. The hook auto-stops acquisition once a sample lands.
 *
 * `qualityCode` is only meaningful once a sample has actually been
 * captured — QualityReported fires per attempt, and only a Good code
 * should be treated as accept-worthy (see isGoodQuality). Anything else is
 * a specific, named rejection reason, not a "kind of ok" scan.
 */
export function useDigitalPersonaReader(): UseDigitalPersonaReaderResult {
  const [status, setStatus] = useState<ReaderStatus>("sdk_loading");
  const [qualityCode, setQualityCode] = useState<QualityCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSample, setLastSample] = useState<CapturedSample | null>(null);
  const initialized = useRef(false);
  const unsubscribeRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let cancelled = false;
    const startedAt = Date.now();

    const waitForSdk = () => {
      if (cancelled) return;

      if (typeof window !== "undefined" && (window as any).WebSdkCore) {
        bootstrap();
        return;
      }

      if (Date.now() - startedAt > SDK_WAIT_TIMEOUT_MS) {
        setErrorMessage(
          "The DigitalPersona transport script never loaded. Confirm the vendor file is " +
            "in place and DigitalPersonaScripts is rendered in your root layout."
        );
        setStatus("error");
        return;
      }

      setTimeout(waitForSdk, SDK_POLL_INTERVAL_MS);
    };

    const bootstrap = () => {
      try {
        dpClient.init();
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to initialize the fingerprint reader.");
        setStatus("error");
        return;
      }
      setStatus("no_device");

      unsubscribeRef.current = [
        dpClient.onDeviceChange(({ connected }) => setStatus(connected ? "ready" : "no_device")),
        dpClient.onError((msg) => {
          setErrorMessage(msg);
          setStatus("error");
        }),
        dpClient.onQuality((code) => setQualityCode(code)),
        dpClient.onSample((sample) => {
          setLastSample(sample);
          setStatus("sample_captured");
          dpClient.stopCapture().catch(() => {});
        }),
      ];
    };

    waitForSdk();
    return () => {
      cancelled = true;
      unsubscribeRef.current.forEach((off) => off());
    };
  }, []);

  const startScan = useCallback(async () => {
    setErrorMessage(null);
    setLastSample(null);
    setQualityCode(null);
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
    setQualityCode(null);
    setErrorMessage(null);
    setLastSample(null);
  }, []);

  return { status, qualityCode, errorMessage, lastSample, startScan, stopScan, reset };
}

export { isGoodQuality };
