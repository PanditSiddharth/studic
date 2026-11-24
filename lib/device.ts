import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export const DEVICE_COOKIE = "studic_device";
const DEVICE_PATTERN = /^[a-f0-9]{32,96}$/i;
const ONE_YEAR = 60 * 60 * 24 * 365;

/** Device ids live in an httpOnly cookie so they cannot be copied by scripts. */
export async function readDeviceId(): Promise<string> {
  try {
    const store = await cookies();
    const value = store.get(DEVICE_COOKIE)?.value || "";
    return DEVICE_PATTERN.test(value) ? value : "";
  } catch {
    return "";
  }
}

export async function ensureDeviceId(): Promise<string> {
  return (await readDeviceId()) || randomBytes(24).toString("hex");
}

export async function writeDeviceId(deviceId: string) {
  const store = await cookies();
  store.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
