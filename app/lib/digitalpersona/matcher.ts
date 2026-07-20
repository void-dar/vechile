// lib/digitalpersona/matcher.ts
//
// Minutiae matching itself happens inside DigitalPersona's proprietary
// engine, not in plain JS/TS. In a real deployment this module calls out to
// one of:
//   1. DigitalPersona's Server SDK (native addon / gRPC service) running
//      alongside your Next.js server, or
//   2. A small internal microservice that wraps their C/C++ matching SDK.
//
// This file defines the contract the rest of the backend relies on, plus a
// thin HTTP client for option (1)/(2). Point DP_MATCH_SERVICE_URL at
// wherever that matching service lives.

export interface MatchRequest {
  probeTemplate: string; // base64 FMD just captured at the vehicle
  candidateTemplates: { fingerprintId: string; template: string }[];
  /** Minimum acceptable score, 0-100. DigitalPersona typically recommends
   *  tuning this against your FAR/FRR requirements; start conservative. */
  threshold?: number;
}

export interface MatchResult {
  matchedFingerprintId: string | null;
  score: number;
}

const MATCH_SERVICE_URL = process.env.DP_MATCH_SERVICE_URL ?? "http://localhost:5100/match";
const DEFAULT_THRESHOLD = 70;

/**
 * Compares one freshly-captured template against a list of enrolled
 * candidates (typically: every active fingerprint linked to the vehicle).
 * Returns the best match above threshold, or null if nothing qualifies.
 */
export async function matchFingerprint(req: MatchRequest): Promise<MatchResult> {
  const threshold = req.threshold ?? DEFAULT_THRESHOLD;

  const res = await fetch(MATCH_SERVICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      probe: req.probeTemplate,
      candidates: req.candidateTemplates,
    }),
  });

  if (!res.ok) {
    throw new Error(`Matching service returned ${res.status}`);
  }

  const data: { bestFingerprintId: string | null; score: number } = await res.json();

  if (!data.bestFingerprintId || data.score < threshold) {
    return { matchedFingerprintId: null, score: data.score ?? 0 };
  }

  return { matchedFingerprintId: data.bestFingerprintId, score: data.score };
}
