import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Google publishes the keys used to sign ID tokens here. The JWK set is created
 * once per server process so `jose` can cache the keys instead of downloading
 * them for every sign-in attempt.
 */
const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type VerifiedGoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

/**
 * Cryptographically verify a Google ID token from the One Tap / FedCM flow.
 *
 * Checks performed:
 * - RS256 signature against Google's published JWKS
 * - `iss` is a Google issuer
 * - `aud` matches our own Google OAuth client id
 * - `exp` / `nbf` (with a small clock tolerance)
 * - `email_verified` is true, so an unverified Google address can never be
 *   used to take over a Studic account that already owns that email
 *
 * Returns the verified identity, or `null` when anything is off.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedGoogleProfile | null> {
  const clientId = process.env.AUTH_GOOGLE_ID;
  if (!clientId || !idToken) return null;

  try {
    const { payload } = await jwtVerify(idToken, googleJwks, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: clientId,
      clockTolerance: 60,
    });

    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const emailVerified = payload.email_verified === true || String(payload.email_verified) === "true";

    if (!email || !emailVerified) return null;
    if (typeof payload.sub !== "string" || !payload.sub) return null;

    const name = typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : undefined;
    const picture = typeof payload.picture === "string" && payload.picture ? payload.picture : undefined;

    return { sub: payload.sub, email, name, picture };
  } catch (error) {
    console.error("Google One Tap token verification failed", error);
    return null;
  }
}
