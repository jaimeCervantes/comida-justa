"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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

const THEME_CHANGED_EVENT = "hazlo-sano:theme-changed";

function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === "system" || value === "light" || value === "dark";
}

function writeThemeChoice(next: ThemeChoice): void {
  if (next === "system") {
    document.documentElement.removeAttribute("data-theme");
    // biome-ignore lint/suspicious/noDocumentCookie: la Cookie Store API es async y todavía no la soporta Safari/iOS; este sitio no puede perder ese tráfico por un `await` cosmético.
    document.cookie = `${THEME_COOKIE}=; path=/; max-age=0; samesite=lax`;

    return;
  }

  document.documentElement.dataset.theme = next;
  // biome-ignore lint/suspicious/noDocumentCookie: mismo motivo que arriba.
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
}

type ThemeToggleProps = {
  initial: ThemePreference | null;
  showLabel?: boolean;
};

/**
 * El conmutador de tema del chrome.
 *
 * Un botón que rota entre las tres cosas que puede querer quien visita — seguir el sistema, forzar
 * claro, forzar oscuro — y no un desplegable: son tres estados en un ciclo, no una lista de la que
 * elegir. Puede vivir varias veces en la misma página; por eso cada instancia escucha el evento que
 * despacha cualquier otra y actualiza su etiqueta sin esperar una recarga.
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
  showLabel = true,
}: ThemeToggleProps) {
  const t = useTranslations("footer.theme");
  const [current, setCurrent] = useState<ThemeChoice>(initial ?? "system");

  useEffect(() => {
    const syncThemeChoice = (event: Event): void => {
      if (!(event instanceof CustomEvent) || !isThemeChoice(event.detail)) {
        return;
      }

      setCurrent(event.detail);
    };

    window.addEventListener(THEME_CHANGED_EVENT, syncThemeChoice);

    return () => {
      window.removeEventListener(THEME_CHANGED_EVENT, syncThemeChoice);
    };
  }, []);

  function cycle() {
    const next = NEXT[current];
    setCurrent(next);
    writeThemeChoice(next);

    window.dispatchEvent(
      new CustomEvent(THEME_CHANGED_EVENT, { detail: next }),
    );
  }

  const currentIcon = ICON[current];
  const label = t(`label.${current}`);

  return (
    <Button
      type="button"
      color="white"
      size="md"
      onClick={cycle}
      startIcon={showLabel ? currentIcon : undefined}
      aria-label={t(`switchTo.${NEXT[current]}`)}
      data-testid="theme-toggle"
      className={
        showLabel
          ? "border border-separator"
          : "h-12 w-12 border border-separator px-0"
      }
    >
      {showLabel ? label : currentIcon}
    </Button>
  );
}
