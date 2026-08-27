"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { LuMonitor, LuMoon, LuSun } from "react-icons/lu";
import {
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  type ThemePreference,
} from "~/infra/theme/themeCookie";
import { Button } from "~/presentation/design_system/buttons/Button";

type ThemeChoice = ThemePreference | "system";

const NEXT: Record<ThemeChoice, ThemeChoice> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const ICON: Record<ThemeChoice, React.ReactNode> = {
  system: <LuMonitor aria-hidden />,
  light: <LuSun aria-hidden />,
  dark: <LuMoon aria-hidden />,
};

/**
 * El conmutador de tema del pie.
 *
 * Un botón que rota entre las tres cosas que puede querer quien visita — seguir el sistema, forzar
 * claro, forzar oscuro — y no un desplegable: son tres estados en un ciclo, no una lista de la que
 * elegir.
 *
 * **Muta el DOM directamente, sin pasar por React.** El servidor ya manda `<html>` con el atributo
 * correcto (`RootLayout` lee la cookie), así que lo único que falta es que un clic lo cambie ahora
 * mismo y lo deje escrito para la próxima carga. Pedirle esto a un Server Action —como hace la
 * ubicación— sería re-renderizar el árbol entero por un atributo CSS que ningún dato del servidor
 * necesita conocer.
 *
 * **Sin cookie, no hay parpadeo posible**: `RootLayout` la lee antes del primer pintado, así que no
 * hace falta el script que evita el "flash of wrong theme" que sí necesitaría `localStorage`.
 */
export default function ThemeToggle({
  initial,
}: {
  initial: ThemePreference | null;
}) {
  const t = useTranslations("footer.theme");
  const [current, setCurrent] = useState<ThemeChoice>(initial ?? "system");

  function cycle() {
    const next = NEXT[current];
    setCurrent(next);

    if (next === "system") {
      document.documentElement.removeAttribute("data-theme");
      // biome-ignore lint/suspicious/noDocumentCookie: la Cookie Store API es async y todavía no la soporta Safari/iOS; este sitio no puede perder ese tráfico por un `await` cosmético.
      document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;
    } else {
      document.documentElement.dataset.theme = next;
      // biome-ignore lint/suspicious/noDocumentCookie: mismo motivo que arriba.
      document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
    }
  }

  return (
    <Button
      type="button"
      color="white"
      size="md"
      onClick={cycle}
      startIcon={ICON[current]}
      aria-label={t(`switchTo.${NEXT[current]}`)}
      data-testid="theme-toggle"
      className="border border-separator"
    >
      {t(`label.${current}`)}
    </Button>
  );
}
