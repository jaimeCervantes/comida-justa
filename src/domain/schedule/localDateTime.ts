import { COMMUNITY_TIME_ZONE, COMMUNITY_UTC_OFFSET_MINUTES } from "./timezone";

const LOCAL_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const GMT_OFFSET = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/;
const MINUTE = 60_000;

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function readPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): number {
  return Number(parts.find((part) => part.type === type)?.value ?? "NaN");
}

function localPartsInTimeZone(
  instant: Date,
  timeZone: string,
): LocalDateTimeParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);

  return {
    year: readPart(parts, "year"),
    month: readPart(parts, "month"),
    day: readPart(parts, "day"),
    hour: readPart(parts, "hour"),
    minute: readPart(parts, "minute"),
    second: readPart(parts, "second"),
  };
}

function isSameParts(
  left: LocalDateTimeParts,
  right: LocalDateTimeParts,
): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  );
}

function isSameLocalDateTime(
  instant: Date,
  offsetMinutes: number,
  expected: LocalDateTimeParts,
): boolean {
  const local = new Date(instant.getTime() + offsetMinutes * MINUTE);

  return isSameParts(
    {
      year: local.getUTCFullYear(),
      month: local.getUTCMonth() + 1,
      day: local.getUTCDate(),
      hour: local.getUTCHours(),
      minute: local.getUTCMinutes(),
      second: local.getUTCSeconds(),
    },
    expected,
  );
}

function parseLocalDateTimeParts(value: string): LocalDateTimeParts | null {
  const match = LOCAL_DATE_TIME.exec(value.trim());

  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] =
    match;
  const parts: LocalDateTimeParts = {
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

  return parts;
}

export function parseLocalDateTimeAtOffset(
  value: string,
  offsetMinutes: number,
): Date | null {
  const parts = parseLocalDateTimeParts(value);

  if (!parts) return null;

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

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

function resolveTimeZone(value: unknown): string {
  const timeZone = typeof value === "string" ? value.trim() : "";

  return timeZone && isValidTimeZone(timeZone) ? timeZone : COMMUNITY_TIME_ZONE;
}

function offsetMinutesForTimeZone(
  timeZone: string,
  instant: Date,
): number | null {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
    hour: "2-digit",
  }).formatToParts(instant);
  const label = parts.find((part) => part.type === "timeZoneName")?.value;

  if (!label) return null;
  if (label === "GMT") return 0;

  const match = GMT_OFFSET.exec(label);

  if (!match) return null;

  const [, signText, hoursText, minutesText] = match;
  const sign = signText === "+" ? 1 : -1;
  const hours = Number(hoursText);
  const minutes = Number(minutesText ?? "0");

  return sign * (hours * 60 + minutes);
}

export function parseDateTimeLocalInTimeZone(
  value: unknown,
  timeZone: unknown,
): Date | null {
  if (typeof value !== "string" || value.trim() === "") return null;

  const parts = parseLocalDateTimeParts(value);

  if (!parts) return null;

  const resolvedTimeZone = resolveTimeZone(timeZone);
  let instant = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = offsetMinutesForTimeZone(resolvedTimeZone, instant);

    if (offset === null) return null;

    const next = new Date(
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      ) -
        offset * MINUTE,
    );

    if (next.getTime() === instant.getTime()) break;
    instant = next;
  }

  return isSameParts(localPartsInTimeZone(instant, resolvedTimeZone), parts)
    ? instant
    : null;
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

export function formatDateTimeLocalInTimeZone(
  value: Date | string | null | undefined,
  timeZone: unknown,
): string {
  if (!value) return "";

  const instant = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(instant.getTime())) return "";

  const parts = localPartsInTimeZone(instant, resolveTimeZone(timeZone));

  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(
    parts.hour,
  )}:${pad(parts.minute)}`;
}
