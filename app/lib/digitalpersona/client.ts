/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/digitalpersona/client.ts
//
// IMPORTANT: @digitalpersona/websdk must NEVER be `import`ed here or
// anywhere else in the app. It's a legacy UMD/AMD bundle whose internal
// `define('WebSdkCore...', ['async', 'sjcl', 'BigInteger', 'SRPClient', ...], factory)`
// call lists dependencies that only exist as globals, not as installable
// npm packages — a bundler that tries to resolve them (Next.js/webpack does,
// on a static `import`) fails with "Module not found: Can't resolve
// 'BigInteger'" and similar. The library is designed to be loaded as a
// plain <script> tag instead: with no AMD loader present, it falls back to
// attaching itself directly to `window`. See components/vendor/
// DigitalPersonaScripts.tsx for how it's loaded, and the README for how to
// get the actual vendor file in place.
//
// This file only ever reads `window.Fingerprint` — it never imports the
// package.
"use client";

export type CaptureFormat = "PNG" | "ISO" | "Intermediate";

export interface CapturedSample {
  raw: string; // base64 sample data, format depends on CaptureFormat
  format: CaptureFormat;
}

export interface ReaderDevice {
  DeviceID: string;
  DeviceTech: number;
}

type Listener<T> = (payload: T) => void;

function getGlobalFingerprintSdk(): any {
  const sdk = (window as any).Fingerprint;
  if (!sdk) {
    throw new Error(
      "window.Fingerprint isn't defined yet. The DigitalPersona script hasn't " +
        "loaded — check DigitalPersonaScripts is rendered in your root layout " +
        "and that the vendor file exists at the path it points to."
    );
  }
  return sdk;
}

export class DigitalPersonaClient {
  private api: any | null = null;
  private connected = false;
  private currentDeviceUid: string | null = null;

  private onSampleListeners: Listener<CapturedSample>[] = [];
  private onQualityListeners: Listener<number>[] = [];
  private onDeviceListeners: Listener<{ connected: boolean; deviceUid?: string }>[] = [];
  private onErrorListeners: Listener<string>[] = [];

  /** Boots the SDK and wires up event handlers. Call once on mount, after
   *  the vendor script has loaded (see useDigitalPersonaReader's retry loop). */
  init() {
    if (typeof window === "undefined") return;

    const FPTypes = getGlobalFingerprintSdk();
    this.api = new FPTypes.WebApi();

    this.api.onDeviceConnected = (event: { deviceUid: string }) => {
      this.connected = true;
      this.currentDeviceUid = event.deviceUid;
      this.onDeviceListeners.forEach((cb) => cb({ connected: true, deviceUid: event.deviceUid }));
    };

    this.api.onDeviceDisconnected = (event: { deviceUid: string }) => {
      this.connected = false;
      this.onDeviceListeners.forEach((cb) => cb({ connected: false, deviceUid: event.deviceUid }));
    };

    this.api.onCommunicationFailed = () => {
      this.onErrorListeners.forEach((cb) =>
        cb("Lost connection to the DigitalPersona agent. Confirm it's running.")
      );
    };

    this.api.onSamplesAcquired = (event: { samples: string; sampleFormat: number }) => {
      // sampleFormat 1 = Raw/Intermediate, 2 = Compressed, 3 = PNG — see SDK docs.
      const samples: string[] = JSON.parse(event.samples);
      const sample = samples[0];
      this.onSampleListeners.forEach((cb) =>
        cb({ raw: sample, format: "Intermediate" })
      );
    };

    this.api.onQualityReported = (event: { quality: number }) => {
      this.onQualityListeners.forEach((cb) => cb(event.quality));
    };

    this.api.onErrorOccurred = (event: { error: number }) => {
      this.onErrorListeners.forEach((cb) => cb(`Reader error code ${event.error}`));
    };
  }

  async listDevices(): Promise<ReaderDevice[]> {
    if (!this.api) throw new Error("DigitalPersonaClient not initialized");
    return this.api.enumerateDevices();
  }

  /** Starts continuous capture on the first available (or specified) reader. */
  async startCapture(deviceUid?: string) {
    if (!this.api) throw new Error("DigitalPersonaClient not initialized");
    let uid = deviceUid;
    if (!uid) {
      const devices = await this.listDevices();
      if (!devices.length) {
        throw new Error("No DigitalPersona 4500 reader detected. Plug it in and try again.");
      }
      uid = devices[0].DeviceID;
    }
    this.currentDeviceUid = uid;
    const FPTypes = getGlobalFingerprintSdk();
    await this.api.startAcquisition(FPTypes.SampleFormat.Intermediate, uid);
  }

  async stopCapture() {
    if (!this.api || !this.currentDeviceUid) return;
    await this.api.stopAcquisition(this.currentDeviceUid);
  }

  onSample(cb: Listener<CapturedSample>) {
    this.onSampleListeners.push(cb);
    return () => this.removeListener(this.onSampleListeners, cb);
  }

  onQuality(cb: Listener<number>) {
    this.onQualityListeners.push(cb);
    return () => this.removeListener(this.onQualityListeners, cb);
  }

  onDeviceChange(cb: Listener<{ connected: boolean; deviceUid?: string }>) {
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
