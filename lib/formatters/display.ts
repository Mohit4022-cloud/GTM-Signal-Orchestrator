import { format, formatDistanceToNowStrict } from "date-fns";

export function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

export function formatDateTime(value: Date | string) {
  return format(new Date(value), "MMM d, yyyy 'at' h:mm a");
}

export function formatShortDate(value: Date | string) {
  return format(new Date(value), "MMM d");
}

export function formatRelativeTime(value: Date | string) {
  return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
}

export function getScoreBucket(score: number) {
  if (score >= 80) return "Hot";
  if (score >= 65) return "Warm";
  return "Cold";
}
