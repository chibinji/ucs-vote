import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return;
  const originHost = new URL(origin).host;
  if (originHost !== host) {
    throw new Error("Cross-origin request blocked");
  }
}

export function deviceTypeFromLabel(label: string | null | undefined) {
  const value = (label || "").toLowerCase();
  if (value.includes("mobile") || value.includes("android") || value.includes("iphone")) {
    return "phone";
  }
  return "desktop";
}
