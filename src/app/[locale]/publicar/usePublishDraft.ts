"use client";

import { type RefObject, useCallback, useEffect, useState } from "react";
import {
  EMPTY_PUBLISH_DRAFT,
  type PublishDraft,
  publishShowsPrice,
} from "./publishChecklist";

/** Los campos que solo existen en el DOM: nadie los controla desde React. */
const UNCONTROLLED = ["title", "price", "phone", "content"] as const;

type UncontrolledDraft = Pick<PublishDraft, (typeof UNCONTROLLED)[number]>;

const EMPTY_UNCONTROLLED: UncontrolledDraft = {
  title: EMPTY_PUBLISH_DRAFT.title,
  price: EMPTY_PUBLISH_DRAFT.price,
  phone: EMPTY_PUBLISH_DRAFT.phone,
  content: EMPTY_PUBLISH_DRAFT.content,
};

function readUncontrolled(scope: HTMLElement | null): UncontrolledDraft {
  if (!scope) return EMPTY_UNCONTROLLED;

  const read = (name: string): string =>
    scope.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${name}"]`,
    )?.value ?? "";

  return {
    title: read("title"),
    price: read("price"),
    phone: read("phone"),
    content: read("content"),
  };
}

const sameDraft = (a: UncontrolledDraft, b: UncontrolledDraft): boolean =>
  UNCONTROLLED.every((field) => a[field] === b[field]);

/**
 * Lo que se lleva escrito, leído del formulario mientras se escribe.
 *
 * Lo necesitan la vista previa y el checklist del 5.3, y el problema era de dónde sacarlo: de los
 * doce campos, solo `kind` y `category` están controlados por React; el resto son **no
 * controlados** a propósito —el navegador valida `required` y `pattern` sobre ellos, y `Form`
 * enfoca el primero que rechaza—. Volverlos controlados para poder leerlos habría cambiado la
 * validación de toda la pantalla para pintar una tarjeta al lado.
 *
 * Así que se leen del DOM cuando cambian. **Esta vez sí es un mecanismo que funciona en un
 * navegador de verdad**: `input` y `change` burbujean —a diferencia de `invalid`, que fue lo que
 * hundió el marcado de pasos pendientes—, así que un solo oyente en el contenedor ve cada tecla de
 * cada campo, incluidos los que están tras un `hidden` de otro paso. Lo comprueba
 * `src/e2e/publicar/vistaPrevia.spec.ts` en Chrome, no solo jsdom.
 *
 * Los oyentes son nativos y no `onChange` de React a propósito: sobre un `<div>`, el `onChange`
 * sintético pasa por el plugin de eventos de formulario de React, que está pensado para el control
 * en sí y no para un ancestro. El evento nativo no tiene ese matiz.
 *
 * Lo ya controlado entra como argumento en vez de releerse: donde hay una fuente de verdad en
 * React, leer el DOM es fabricar una segunda.
 */
export function usePublishDraft({
  scope,
  kind,
  category,
  mediaCount,
}: {
  /** El contenedor de los tres pasos. Basta uno: los campos escondidos siguen en el árbol. */
  scope: RefObject<HTMLElement | null>;
  kind: string;
  category: string;
  mediaCount: number;
}): PublishDraft {
  const [uncontrolled, setUncontrolled] =
    useState<UncontrolledDraft>(EMPTY_UNCONTROLLED);

  const sync = useCallback(() => {
    const next = readUncontrolled(scope.current);
    /* Solo se re-renderiza si algo cambió de verdad: `change` y `input` llegan los dos por el mismo
       tecleo, y sin esto cada letra costaría dos pasadas. */
    setUncontrolled((current) => (sameDraft(current, next) ? current : next));
  }, [scope]);

  useEffect(() => {
    const node = scope.current;
    if (!node) return;

    node.addEventListener("input", sync);
    node.addEventListener("change", sync);
    /* La primera lectura no la trae ningún evento: un formulario reabierto tras un rechazo del
       servidor llega con los valores puestos, y sin esto la tarjeta nacería vacía. */
    sync();

    return () => {
      node.removeEventListener("input", sync);
      node.removeEventListener("change", sync);
    };
  }, [scope, sync]);

  return {
    ...uncontrolled,
    /* Un campo que no está en pantalla no cuenta. Al pasar de producto a anuncio el precio deja de
       existir, y el valor que quedó leído no puede seguir dándose por bueno. Se resuelve aquí y no
       con otro efecto porque es una derivación, no un cambio: con efecto habría un render con el
       precio fantasma antes de corregirse. */
    price: publishShowsPrice(kind) ? uncontrolled.price : "",
    kind,
    category,
    mediaCount,
  };
}
