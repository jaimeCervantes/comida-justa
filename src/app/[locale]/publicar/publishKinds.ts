import { POST_KINDS, type PostKind } from "~/domain/entities/post/kind";

/**
 * Los cuatro tipos de publicación, en el orden en que se ofrecen y con su rótulo.
 *
 * **El orden no es el del dominio, y es a propósito.** `POST_KINDS` empieza por `anuncio` porque es
 * el que cae por omisión; el 5.3 empieza por producto, evento y servicio y deja el anuncio al final.
 * Es la misma decisión que se tomó al quitar los enlaces de contenido de la portada: lo primero que
 * se ve tiene que ser lo que la comunidad viene a buscar, y publicar algo que se vende o que ocurre
 * vale más que publicar un aviso.
 *
 * Lo que **sí** sale del dominio es la lista: una prueba comprueba que están los cuatro y solo los
 * cuatro, así que sumar un tipo en `POST_KINDS` sin ofrecerlo aquí se pone rojo en vez de dejar un
 * tipo que existe y no se puede elegir.
 *
 * Las claves de traducción se escriben enteras —nada de `` t(`kind${capitalize(key)}`) ``—: una
 * clave que no se puede encontrar con grep es una clave que se pierde en la siguiente limpieza.
 */
export interface PublishKindOption {
  value: PostKind;
  labelKey: "kindProduct" | "kindEvent" | "kindService" | "kindAnnouncement";
}

export const PUBLISH_KIND_OPTIONS: readonly PublishKindOption[] = [
  { value: "producto", labelKey: "kindProduct" },
  { value: "evento", labelKey: "kindEvent" },
  { value: "servicio", labelKey: "kindService" },
  /* El último, aunque sea el que viene marcado: es el cajón de lo que no es ninguno de los otros
     tres, y ponerlo primero invitaría a elegirlo sin mirar el resto. */
  { value: "anuncio", labelKey: "kindAnnouncement" },
];

/** Todos los tipos del dominio, sin sobras ni ausencias. Lo comprueba `publishKinds.test.ts`. */
export const OFFERED_KINDS: readonly PostKind[] = PUBLISH_KIND_OPTIONS.map(
  (option) => option.value,
);

/** El identificador con el que las pruebas alcanzan una píldora sin depender del idioma. */
export function publishKindTestId(kind: string): string {
  return `publish-kind-${kind}`;
}

export { POST_KINDS };
