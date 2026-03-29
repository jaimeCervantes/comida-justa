import { notFound } from "next/navigation";

export default function HabitosPlaceholder() {
  // Dispara explícitamente el not-found local (que ya tiene el Header y Footer del [locale])
  notFound();
}
