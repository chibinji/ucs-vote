import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

export function sixDigitCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function receiptCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = () => alphabet[randomInt(0, alphabet.length)];
  return `${pick()}${pick()}-${pick()}${pick()}${pick()}${pick()}`;
}
