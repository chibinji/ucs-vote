import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const VOTER_COOKIE = "voter_session";
const STAFF_COOKIE = "staff_session";
const DEVICE_COOKIE = "device_token";
const VOTE_DONE_COOKIE = "vote_done";

type VoterPayload = {
  role: "voter";
  voterId: string;
};

type StaffPayload = {
  role: "admin" | "observer";
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(value);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function signToken(payload: VoterPayload | StaffPayload, hours: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secret());
}

export async function readToken<T>(value: string | undefined) {
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, secret());
    return payload as T;
  } catch {
    return null;
  }
}

export async function setVoterSession(voterId: string) {
  const token = await signToken({ role: "voter", voterId }, 12);
  (await cookies()).set(VOTER_COOKIE, token, cookieOptions(60 * 60 * 12));
}

export async function setStaffSession(role: "admin" | "observer") {
  const token = await signToken({ role }, 12);
  (await cookies()).set(STAFF_COOKIE, token, cookieOptions(60 * 60 * 12));
}

export async function setDeviceCookie(token: string) {
  (await cookies()).set(DEVICE_COOKIE, token, cookieOptions(60 * 60 * 24 * 365));
}

export async function setVoteDoneCookie() {
  (await cookies()).set(VOTE_DONE_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

export async function getVoterSession() {
  const token = (await cookies()).get(VOTER_COOKIE)?.value;
  const payload = await readToken<VoterPayload>(token);
  if (!payload || payload.role !== "voter") return null;
  return payload;
}

export async function getStaffSession() {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  const payload = await readToken<StaffPayload>(token);
  if (!payload || (payload.role !== "admin" && payload.role !== "observer")) {
    return null;
  }
  return payload;
}

export async function getDeviceToken() {
  return (await cookies()).get(DEVICE_COOKIE)?.value ?? null;
}

export { VOTER_COOKIE, STAFF_COOKIE, DEVICE_COOKIE, VOTE_DONE_COOKIE };
