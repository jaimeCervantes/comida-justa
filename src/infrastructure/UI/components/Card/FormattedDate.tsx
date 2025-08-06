'use client'
import { useState, useEffect } from 'react';

export default function FormattedDateComponent({ isoDateString }: { isoDateString: string }) {
  const [formattedDate, setFormattedDate] = useState('');

  // useEffect para formatear la fecha SOLO en el cliente (después de la hidratación)
  useEffect(() => {
    if (isoDateString) {
      const dateObject = new Date(isoDateString);
      const userLocale = navigator.language;

      setFormattedDate(
        dateObject.toLocaleString(userLocale, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true
        })
      );
    }
  }, [isoDateString]);

  if (!formattedDate) {
    return (
      <span
        className="relative inline-block bg-gray-200 rounded overflow-hidden"
        style={{ width: '180px', height: '1.2em' }}
      >
        <span
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
          style={{
            width: '40px',
            animation: 'shimmer 1.5s infinite'
          }}
        ></span>
      </span>
    );
  }

  return (<time
    dateTime={isoDateString}
    className="relative inline-block first-letter:uppercase text-sm text-gray-500 dark:text-pw-white">
    {formattedDate}
  </time>);
}
