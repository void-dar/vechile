// lib/crypto.ts
//
// Fingerprint templates (FMDs) are biometric data — never store them
// plaintext. Encrypt with AES-256-GCM using a key from the environment
// (pull from a real secrets manager in production, not a raw env var).

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM

function getKey(): Buffer {
  const secret = process.env.FINGERPRINT_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("FINGERPRINT_ENCRYPTION_KEY is not set");
  }
  // Expect a 32-byte key, base64-encoded, in the env var.
  const key = Buffer.from(secret, "base64");
  if (key.length !== 32) {
    throw new Error("FINGERPRINT_ENCRYPTION_KEY must decode to 32 bytes");
  }
  return key;
}

export function encryptTemplate(plainBase64: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainBase64, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Store iv + authTag + ciphertext together, base64-encoded.
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptTemplate(stored: string): string {
  const key = getKey();
  const buf = Buffer.from(stored, "base64");

  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = buf.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
