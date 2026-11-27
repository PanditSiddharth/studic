"use client";

import Script from "next/script";
import { usePathname, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { GoogleCredentialResponse } from "@/lib/google-one-tap-client";

/**
 * Pages where One Tap must not appear:
 * - the auth page already offers a full Google button
 * - admin, profile and payment are authenticated/transactional screens
 */
const EXCLUDED_PREFIXES = ["/admin", "/auth", "/login", "/profile", "/payment"];
const DISMISSED_KEY = "studic:google-one-tap-dismissed";

function isExcluded(pathname: string) {
  return EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Google Identity Services One Tap.
 *
 * FedCM is enabled by default in the current GIS library, so the deprecated
 * `use_fedcm_for_prompt` flag is intentionally not passed. `auto_select` stays
 * false: a visitor is never signed in without clicking their account, and
 * dismissing the prompt simply leaves them as a guest.
 */
export default function GoogleOneTap({ clientId }: { clientId?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, update } = useSession();
  const [scriptReady, setScriptReady] = useState(false);
  const promptedRef = useRef(false);

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      const credential = response.credential;
      if (!credential) return;

      window.google?.accounts.id.cancel();

      try {
        // Reuses the existing NextAuth credentials pipeline: the server verifies
        // the Google token, the signIn callback finds/creates the account by
        // email, and the normal JWT session cookie is issued.
        const result = await signIn("google-one-tap", { credential, redirect: false });

        if (!result || result.error) {
          toast.error("Google sign-in could not be completed. Please try again.");
          return;
        }

        await update();
        toast.success("Signed in with Google");
        router.refresh();
      } catch {
        toast.error("Google sign-in is unavailable right now.");
      }
    },
    [router, update]
  );

  useEffect(() => {
    if (!clientId || status !== "unauthenticated" || isExcluded(pathname)) return;
    if (promptedRef.current) return;

    let dismissed = false;
    try {
      dismissed = Boolean(window.sessionStorage.getItem(DISMISSED_KEY));
    } catch {
      dismissed = false;
    }
    if (dismissed) return;

    const google = window.google;
    if (!scriptReady || !google?.accounts?.id) return;

    promptedRef.current = true;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: "signin",
      itp_support: true,
    });

    google.accounts.id.prompt((notification) => {
      if (!notification.isDismissedMoment()) return;
      // A returned credential means the user chose an account; that is not a
      // dismissal, so One Tap should remain available on the next page.
      if (notification.getDismissedReason() === "credential_returned") return;

      try {
        window.sessionStorage.setItem(DISMISSED_KEY, "1");
      } catch {
        // Storage can be blocked (private mode); Google's own cooldown still applies.
      }
    });
  }, [clientId, status, pathname, scriptReady, handleCredential]);

  if (!clientId) return null;

  return (
    <Script
      id="google-identity-services"
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onReady={() => setScriptReady(true)}
    />
  );
}
