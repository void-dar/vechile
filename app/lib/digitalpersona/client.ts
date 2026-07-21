/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/digitalpersona/client.ts
//
// Uses @digitalpersona/devices' FingerprintReader, matched against its real
// declaration files:
//   - Device events (DeviceConnected/DeviceDisconnected) carry `deviceId`,
//     NOT `deviceUid` — an earlier version of this file had that wrong.
//   - SamplesAcquired.samples is a BioSample[] (from @digitalpersona/core),
//     already parsed — not a JSON string needing JSON.parse(). BioSample's
//     own field shape wasn't available while writing this; sample data is
//     read defensively below (see the comment at CapturedSample) and should
//     be confirmed against @digitalpersona/core's actual type if capture
//     data comes through empty.
//   - QualityReported.quality is a QualityCode enum (0 = Good, 1-24 = a
//     specific named rejection reason), not a percentage — see
//     lib/digitalpersona/quality.ts.
//
// window.WebSdkCore (loaded via components/vendor/DigitalPersonaScripts.tsx
// as a plain <script> tag) is still required — FingerprintReader's internal
// channel depends on it.
"use client";

import { FingerprintReader, SampleFormat } from "@digitalpersona/devices";
import { QualityCode } from "./quality";

export interface CapturedSample {
  /** Raw sample data pulled off the first BioSample in the event. Field name
   *  is a best guess (.Data / .data / the sample object itself) since
   *  BioSample's exact shape wasn't available — confirm against
   *  @digitalpersona/core if this comes through empty during a real scan. */
  raw: string;
  format: "Intermediate";
}

type Listener<T> = (payload: T) => void;

export class DigitalPersonaClient {
  private reader: FingerprintReader | null = null;
  private connected = false;
  private currentDeviceId: string | null = null;

  private onSampleListeners: Listener<CapturedSample>[] = [];
  private onQualityListeners: Listener<QualityCode>[] = [];
  private onDeviceListeners: Listener<{ connected: boolean; deviceId?: string }>[] = [];
  private onErrorListeners: Listener<string>[] = [];

  /** Call once on mount, after window.WebSdkCore exists (see the reader hook). */
  init() {
    if (typeof window === "undefined") return;
    if (!(window as any).WebSdkCore) {
      throw new Error(
        "window.WebSdkCore isn't defined yet. The DigitalPersona transport script " +
          "hasn't loaded — confirm DigitalPersonaScripts is rendered in your root layout."
      );
    }

    this.reader = new FingerprintReader();

    // Assigning to these properties (rather than .on()) lets TypeScript
    // infer each handler's event type from the property's own declared
    // type (Handler<DeviceConnected>, Handler<SamplesAcquired>, etc.).
    this.reader.onDeviceConnected = (event) => {
      this.connected = true;
      this.currentDeviceId = event.deviceId;
      this.onDeviceListeners.forEach((cb) => cb({ connected: true, deviceId: event.deviceId }));
    };

    this.reader.onDeviceDisconnected = (event) => {
      this.connected = false;
      this.onDeviceListeners.forEach((cb) => cb({ connected: false, deviceId: event.deviceId }));
    };

    this.reader.onCommunicationFailed = () => {
      this.onErrorListeners.forEach((cb) =>
        cb("Lost connection to the DigitalPersona agent. Confirm it's running.")
      );
    };

    this.reader.onSamplesAcquired = (event) => {
      const bioSample = event.samples?.[0] as any;
      if (!bioSample) return;
      const raw = bioSample.Data ?? bioSample.data ?? bioSample;
      this.onSampleListeners.forEach((cb) => cb({ raw, format: "Intermediate" }));
    };

    this.reader.onQualityReported = (event) => {
      // event.quality is the package's own QualityCode enum — numerically
      // identical to our local one (see lib/digitalpersona/quality.ts for
      // why this file doesn't import the package's version directly).
      this.onQualityListeners.forEach((cb) => cb(event.quality as unknown as QualityCode));
    };

    this.reader.onErrorOccurred = (event) => {
      this.onErrorListeners.forEach((cb) => cb(`Reader error code ${event.error}`));
    };
  }

  async listDevices(): Promise<string[]> {
    if (!this.reader) throw new Error("DigitalPersonaClient not initialized");
    return this.reader.enumerateDevices();
  }

  /** Starts continuous acquisition on the first available (or specified) reader. */
  async startCapture(deviceId?: string) {
    if (!this.reader) throw new Error("DigitalPersonaClient not initialized");
    let id = deviceId;
    if (!id) {
      const devices = await this.listDevices();
      if (!devices.length) {
        throw new Error("No DigitalPersona 4500 reader detected. Plug it in and try again.");
      }
      id = devices[0];
    }
    this.currentDeviceId = id;
    await this.reader.startAcquisition(SampleFormat.Intermediate, id);
  }

  async stopCapture() {
    if (!this.reader) return;
    await this.reader.stopAcquisition(this.currentDeviceId ?? undefined);
  }

  onSample(cb: Listener<CapturedSample>) {
    this.onSampleListeners.push(cb);
    return () => this.removeListener(this.onSampleListeners, cb);
  }

  onQuality(cb: Listener<QualityCode>) {
    this.onQualityListeners.push(cb);
    return () => this.removeListener(this.onQualityListeners, cb);
  }

  onDeviceChange(cb: Listener<{ connected: boolean; deviceId?: string }>) {
    this.onDeviceListeners.push(cb);
    return () => this.removeListener(this.onDeviceListeners, cb);
  }

  onError(cb: Listener<string>) {
    this.onErrorListeners.push(cb);
    return () => this.removeListener(this.onErrorListeners, cb);
  }

  isConnected() {
    return this.connected;
  }

  private removeListener<T>(arr: Listener<T>[], cb: Listener<T>) {
    const idx = arr.indexOf(cb);
    if (idx >= 0) arr.splice(idx, 1);
  }
}

// Singleton — the reader connection is a physical, page-wide resource.
export const dpClient = new DigitalPersonaClient();
