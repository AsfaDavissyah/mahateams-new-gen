export const JAKARTA_TIME_ZONE = "Asia/Jakarta";

export function getJakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JAKARTA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

export function getJakartaMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JAKARTA_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value ?? 0
  );

  return hour * 60 + minute;
}

export function dateOnlyFromKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function timeToMinutes(
  time: string | null | undefined,
  fallback: string
) {
  const [hour, minute] = (time || fallback).split(":").map(Number);

  return hour * 60 + minute;
}

export function getDayOfWeek(dateKey: string) {
  const utcDay = dateOnlyFromKey(dateKey).getUTCDay();

  return utcDay === 0 ? 7 : utcDay;
}
