// lib/digitalpersona/quality.ts
//
// A standalone LOCAL enum, NOT imported from @digitalpersona/devices —
// deliberately. This file is imported from both browser code (the scanner
// components) and server code (the enroll/verify API routes), and
// @digitalpersona/devices is explicitly documented as client-only:
// importing it anywhere that runs in Node.js (any app/api/ route) throws
// "WebSdk dependency not found." Values below are copied from the
// package's real QualityCode enum (confirmed against its .d.ts) — they're
// numerically identical, and since this crosses an HTTP request body as a
// plain JSON number anyway, there's no type-identity issue in practice.
// lib/digitalpersona/client.ts (browser-only) casts the package's real
// QualityCode values into this one at the point they're emitted.
//
// It's a categorical enum, not a 0-100 score — 0 means "Good," everything
// else is a specific, named rejection reason. There's no "borderline but
// acceptable" scan; either the code is Good or it's one of these.
export enum QualityCode {
  Good = 0,
  NoImage = 1,
  TooLight = 2,
  TooDark = 3,
  TooNoisy = 4,
  LowContrast = 5,
  NotEnoughFeatures = 6,
  NotCentered = 7,
  NotAFinger = 8,
  TooHigh = 9,
  TooLow = 10,
  TooLeft = 11,
  TooRight = 12,
  TooStrange = 13,
  TooFast = 14,
  TooSkewed = 15,
  TooShort = 16,
  TooSlow = 17,
  ReverseMotion = 18,
  PressureTooHard = 19,
  PressureTooLight = 20,
  WetFinger = 21,
  FakeFinger = 22,
  TooSmall = 23,
  RotatedTooMuch = 24,
}

export const QUALITY_MESSAGES: Record<QualityCode, string> = {
  [QualityCode.Good]: "Good scan",
  [QualityCode.NoImage]: "No finger detected — try again",
  [QualityCode.TooLight]: "Press a little firmer",
  [QualityCode.TooDark]: "Press a little lighter",
  [QualityCode.TooNoisy]: "Scanner surface may be dirty — wipe it and retry",
  [QualityCode.LowContrast]: "Scan was unclear — try again",
  [QualityCode.NotEnoughFeatures]: "Couldn't read enough detail — reposition your finger",
  [QualityCode.NotCentered]: "Center your finger on the sensor",
  [QualityCode.NotAFinger]: "That doesn't look like a finger",
  [QualityCode.TooHigh]: "Move your finger down slightly",
  [QualityCode.TooLow]: "Move your finger up slightly",
  [QualityCode.TooLeft]: "Move your finger right slightly",
  [QualityCode.TooRight]: "Move your finger left slightly",
  [QualityCode.TooStrange]: "Unusual scan — try again",
  [QualityCode.TooFast]: "Slow down slightly",
  [QualityCode.TooSkewed]: "Straighten your finger on the sensor",
  [QualityCode.TooShort]: "Scan was too brief — hold a moment longer",
  [QualityCode.TooSlow]: "Scan was too slow — try again",
  [QualityCode.ReverseMotion]: "Unexpected motion — try again",
  [QualityCode.PressureTooHard]: "Press a little lighter",
  [QualityCode.PressureTooLight]: "Press a little firmer",
  [QualityCode.WetFinger]: "Dry your finger and try again",
  [QualityCode.FakeFinger]: "Scan not recognized as a real finger",
  [QualityCode.TooSmall]: "Not enough of your finger is touching the sensor",
  [QualityCode.RotatedTooMuch]: "Straighten your finger on the sensor",
};

export function isGoodQuality(code: QualityCode | null | undefined): boolean {
  return code === QualityCode.Good;
}

export function qualityMessage(code: QualityCode | null | undefined): string {
  if (code === null || code === undefined) return "";
  return QUALITY_MESSAGES[code] ?? "Unclear scan — try again";
}
