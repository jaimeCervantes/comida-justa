import { COMMUNITY_UTC_OFFSET_MINUTES } from "./timezone";

const LOCAL_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const MINUTE = 60_000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function isSameLocalDateTime(
  instant: Date,
  offsetMinutes: number,
  expected: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  },
): boolean {
  const local = new Date(instant.getTime() + offsetMinutes * MINUTE);

  return (
    local.getUTCFullYear() === expected.year &&
    local.getUTCMonth() + 1 === expected.month &&
    local.getUTCDate() === expected.day &&
    local.getUTCHours() === expected.hour &&
    local.getUTCMinutes() === expected.minute &&
    local.getUTCSeconds() === expected.second
  );
}

export function parseLocalDateTimeAtOffset(
  value: string,
  offsetMinutes: number,
): Date | null {
  const match = LOCAL_DATE_TIME.exec(value.trim());

  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const parts = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
    second: Number(secondText ?? "0"),
  };

  if (
    parts.month < 1 ||
    parts.month > 12 ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59
  ) {
    return null;
  }

  const instant = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ) -
      offsetMinutes * MINUTE,
  );

  return isSameLocalDateTime(instant, offsetMinutes, parts) ? instant : null;
}

export function parseCommunityDateTimeLocal(value: unknown): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;

  return parseLocalDateTimeAtOffset(value, COMMUNITY_UTC_OFFSET_MINUTES);
}

export function formatDateTimeLocalAtOffset(
  value: Date | string | null | undefined,
  offsetMinutes: number,
): string {
  if (!value) return "";

  const instant = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(instant.getTime())) return "";

  const local = new Date(instant.getTime() + offsetMinutes * MINUTE);

  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(
    local.getUTCDate(),
  )}T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
}

export function formatCommunityDateTimeLocal(
  value: Date | string | null | undefined,
): string {
  return formatDateTimeLocalAtOffset(value, COMMUNITY_UTC_OFFSET_MINUTES);
}
