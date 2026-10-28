import type { ChatMessage } from "@/modals/chat.model";

export const initials = (name?: string, fallback = "S") =>
  String(name || fallback)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase() || fallback;

const tones = [
  "from-sky-500 to-indigo-500",
  "from-rose-500 to-orange-500",
  "from-violet-500 to-fuchsia-500",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
];

const nameTones = [
  "text-sky-600 dark:text-sky-400",
  "text-rose-600 dark:text-rose-400",
  "text-violet-600 dark:text-violet-400",
  "text-emerald-600 dark:text-emerald-400",
  "text-amber-600 dark:text-amber-400",
  "text-cyan-600 dark:text-cyan-400",
];

const seedHash = (seed?: string) => {
  const value = String(seed || "chat");
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 9973;
  }
  return hash;
};

export const avatarTone = (seed?: string) => tones[seedHash(seed) % tones.length];

export const senderTone = (seed?: string) => nameTones[seedHash(seed) % nameTones.length];

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

const dayFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const fullDayFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "long" });

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatTime = (value?: string | Date | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return timeFormatter.format(date);
};

export const formatSidebarTime = (value?: string | Date | null) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days <= 0) return timeFormatter.format(date);
  if (days === 1) return "Yesterday";
  if (days < 7) return weekdayFormatter.format(date).slice(0, 3);
  return date.getFullYear() === now.getFullYear() ? dayFormatter.format(date) : fullDayFormatter.format(date);
};

export const formatDayLabel = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const days = Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return weekdayFormatter.format(date);
  return date.getFullYear() === now.getFullYear() ? dayFormatter.format(date) : fullDayFormatter.format(date);
};

export const dayKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

export const groupMessagesByDay = (messages: ChatMessage[]) => {
  const groups: Array<{ key: string; label: string; messages: ChatMessage[] }> = [];
  for (const message of messages) {
    const key = dayKey(message.createdAt);
    const current = groups[groups.length - 1];
    if (current && current.key === key) {
      current.messages.push(message);
    } else {
      groups.push({ key, label: formatDayLabel(message.createdAt), messages: [message] });
    }
  }
  return groups;
};
