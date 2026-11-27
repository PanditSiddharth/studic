/**
 * Minimal, typed surface for the Google Identity Services (GIS) script that we
 * actually use. Keeping the types in a plain module lets both the One Tap
 * component and the sign-out handlers share them without pulling the component
 * into unrelated bundles.
 */

export type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

export type GooglePromptMomentNotification = {
  /** FedCM still reports dismissals; display/skip reasons are no longer exposed. */
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
};

export type GoogleIdConfiguration = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  /** Never sign a visitor in without an explicit click. */
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: "signin" | "signup" | "use";
  itp_support?: boolean;
};

export type GoogleIdentityServices = {
  accounts: {
    id: {
      initialize: (config: GoogleIdConfiguration) => void;
      prompt: (listener?: (notification: GooglePromptMomentNotification) => void) => void;
      cancel: () => void;
      disableAutoSelect: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

/**
 * Stop Google from automatically re-selecting the account after an explicit
 * logout. Without this, GIS can silently recreate the session on the next visit.
 */
export function disableGoogleAutoSelect() {
  if (typeof window === "undefined") return;
  window.google?.accounts.id.disableAutoSelect();
}
