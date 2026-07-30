"use client";
import { useEffect, useState } from "react";

export default function FormattedDateComponent({
  isoDateString,
}: {
  isoDateString: string;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <span
        className="relative inline-block bg-gray-200 rounded-sm overflow-hidden"
        style={{ width: "180px", height: "1.2em" }}
      >
        <span
          className="absolute top-0 left-0 h-full bg-linear-to-r from-transparent via-white to-transparent opacity-70"
          style={{
            width: "40px",
            animation: "shimmer 1.5s infinite",
          }}
        ></span>
      </span>
    );
  }

  if (!isoDateString) {
    return null;
  }

  const dateObject = new Date(isoDateString);
  if (Number.isNaN(dateObject.getTime())) {
    return null;
  }
  const userLocale = navigator.language;

  const formattedDate = dateObject.toLocaleString(userLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  return (
    <time
      dateTime={isoDateString}
      className="relative inline-block first-letter:uppercase text-sm text-gray-500 dark:text-pw-white"
    >
      {formattedDate}
    </time>
  );
}
