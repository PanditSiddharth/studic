import { createHmac, randomInt, timingSafeEqual } from "crypto";

const secret = () =>
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.URI ||
  "studic-local-otp-secret";

/** Six-digit numeric code, generated with a CSPRNG. */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Codes are never stored in plain text. */
export function hashOtp(code: string): string {
  return createHmac("sha256", secret()).update(code).digest("hex");
}

export function otpMatches(code: string, storedHash: string): boolean {
  try {
    const expected = Buffer.from(storedHash, "hex");
    const actual = Buffer.from(hashOtp(code), "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

const LOGIN_TOKEN_TTL_MS = 2 * 60 * 1000;

export type LoginTokenPayload = {
  email: string;
  deviceId: string;
  exp: number;
};

const sign = (value: string) =>
  createHmac("sha256", secret()).update(value).digest("base64url");

/**
 * Short-lived signed proof that this browser just passed the OTP step. It is
 * passed to the Credentials provider instead of a password so the session can
 * be created without ever trusting the client's claim of "OTP verified".
 */
export function signLoginToken(input: { email: string; deviceId: string }): string {
  const payload: LoginTokenPayload = {
    email: input.email.trim().toLowerCase(),
    deviceId: input.deviceId,
    exp: Date.now() + LOGIN_TOKEN_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyLoginToken(token?: string | null): LoginTokenPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    const expected = Buffer.from(sign(body));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as LoginTokenPayload;
    if (!payload?.email || !payload?.deviceId || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
