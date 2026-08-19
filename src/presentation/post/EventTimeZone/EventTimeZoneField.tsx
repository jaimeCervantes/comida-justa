"use client";

import { useEffect, useState } from "react";
import { COMMUNITY_TIME_ZONE } from "~/domain/schedule/timezone";

export function useBrowserTimeZone(): string {
  const [timeZone, setTimeZone] = useState<string>(COMMUNITY_TIME_ZONE);

  useEffect(() => {
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (browserTimeZone) setTimeZone(browserTimeZone);
  }, []);

  return timeZone;
}

export default function EventTimeZoneField({
  name = "timeZone",
  timeZone,
}: {
  name?: string;
  timeZone: string;
}) {
  return <input type="hidden" name={name} value={timeZone} readOnly />;
}
