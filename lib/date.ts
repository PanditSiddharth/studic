/**
 * Dates must be formatted with a fixed locale and time zone so the server and
 * the browser always produce the same string. Using the runtime defaults makes
 * React hydration fail when the server locale differs from the visitor's.
 */
export const SITE_LOCALE = "en-IN";
export const SITE_TIME_ZONE = "Asia/Kolkata";

type DateInput = string | number | Date | null | undefined;

const toValidDate = (value: DateInput) => {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatDate(
  value: DateInput,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
) {
  const date = toValidDate(value);
  if (!date) return "";
  return date.toLocaleDateString(SITE_LOCALE, { timeZone: SITE_TIME_ZONE, ...options });
}

export function formatDateTime(value: DateInput) {
  const date = toValidDate(value);
  if (!date) return "";
  return date.toLocaleString(SITE_LOCALE, {
    timeZone: SITE_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
}
