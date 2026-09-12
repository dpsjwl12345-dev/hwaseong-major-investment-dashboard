import { ONE_YEAR_MS } from "@shared/const";
import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

// Simple single-role admin session: no per-user identity, just a signed
// cookie that says "this browser typed the admin password". Replaces the
// old Manus OAuth login, which required an external auth portal that this
// project no longer has access to.

const ADMIN_SESSION_SUBJECT = "admin";

function getSecretKey() {
  if (!ENV.cookieSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createAdminSessionToken(): Promise<string> {
  const issuedAt = Date.now();
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(ADMIN_SESSION_SUBJECT)
    .setIssuedAt()
    .setExpirationTime(Math.floor((issuedAt + ONE_YEAR_MS) / 1000))
    .sign(getSecretKey());
}

export async function verifyAdminSessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token || !ENV.cookieSecret) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    return payload.sub === ADMIN_SESSION_SUBJECT && payload.role === "admin";
  } catch {
    return false;
  }
}
