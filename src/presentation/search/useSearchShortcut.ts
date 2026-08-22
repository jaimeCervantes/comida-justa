"use client";

import { type RefObject, useEffect, useState } from "react";

/**
 * El atajo de teclado del buscador: **⌘K** en un Mac, **Ctrl K** en el resto.
 *
 * Es la otra mitad de la anotación del 5.1 —«la búsqueda dice qué buscar»—: el campo ya nombra
 * ejemplos del catálogo, y esto es lo que lo pone a un gesto de distancia desde cualquier página, en
 * vez de obligar a apuntar con el ratón a la barra de arriba.
 *
 * **Solo actúa sobre el campo que se ve.** El header pinta dos buscadores —uno para escritorio y
 * otro para el teléfono, y esconde el que no toca— así que sin esta comprobación el atajo enfocaría
 * un campo con `display: none`, que es enfocar nada. `offsetParent` es la pregunta barata que
 * contesta «¿este elemento está pintado?».
 *
 * **`preventDefault` no es opcional:** Ctrl+K ya está cogido en Firefox (enfoca su propia barra de
 * búsqueda) y en algunos gestores de contraseñas. Sin él, el atajo del sitio pierde contra el del
 * navegador justo en el navegador donde más falta hace decirlo.
 */
export function useSearchShortcut(
  inputRef: RefObject<HTMLInputElement | null>,
): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (!isShortcut) return;

      const input = inputRef.current;
      // `offsetParent` es `null` cuando el elemento —o un ancestro— está en `display: none`.
      if (!input || input.offsetParent === null) return;

      event.preventDefault();
      input.focus();
      /* Selecciona lo que hubiera: quien pulsa el atajo viene a buscar otra cosa, no a añadirle
         letras a la búsqueda anterior. */
      input.select();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [inputRef]);
}

/**
 * Cómo se llama el atajo en **este** teclado, o `null` hasta saberlo.
 *
 * Se resuelve después de montar y no durante el render a propósito. El servidor no sabe qué teclado
 * hay al otro lado, así que pintar «⌘K» y corregirlo en el cliente sería una discrepancia de
 * hidratación —y, en un Windows, un parpadeo enseñando la tecla equivocada—. `null` significa
 * «todavía no lo sé», y quien lo pinta no pinta nada: es una ayuda, no información.
 */
export function useShortcutHint(): string | null {
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const isApple = /mac|iphone|ipad|ipod/i.test(
      navigator.userAgent || navigator.platform,
    );

    setHint(isApple ? "⌘K" : "Ctrl K");
  }, []);

  return hint;
}
