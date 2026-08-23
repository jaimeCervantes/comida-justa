import { EVENT_KIND, SERVICE_KIND } from "~/domain/entities/post/kind";

/**
 * «Falta poco»: qué le queda a quien publica, mirado desde lo que lleva escrito.
 *
 * Es la columna derecha de la pantalla 5.3, y es la mitad que el asistente no puede dar por sí
 * mismo. Los tres pasos dicen **dónde estás**; esto dice **qué falta** — que es la pregunta que
 * alguien se hace cuando lleva dos minutos y no sabe si ya puede publicar.
 *
 * **Vive fuera del componente por la misma razón que `publishSteps.ts`**: es una regla, no una
 * pintura. Aquí se decide qué cuenta como «hecho» y se prueba sin navegador; el componente solo
 * pinta lo que esta función devuelve. Y las dos tablas se apoyan: cada punto sabe **a qué campo
 * lleva**, y el paso al que hay que saltar sale de `stepForField`, así que no hay una segunda copia
 * del reparto que pueda desincronizarse.
 *
 * El canvas dibuja cuatro puntos para un formulario de cuatro campos; este tiene doce y dos
 * obligatorios más —la descripción y el teléfono— que en cuatro puntos quedaban fuera. Un checklist
 * que omite un campo obligatorio es peor que no tenerlo: promete «falta poco» y luego el envío
 * falla por algo que nunca se mencionó.
 */
export type PublishChecklistItemId =
  | "essentials"
  | "pillar"
  | "content"
  | "contact"
  | "media";

export interface PublishChecklistItem {
  id: PublishChecklistItemId;
  /** Clave del catálogo `publish`, escrita entera para que se pueda grepear. */
  labelKey:
    | "checkTitle"
    | "checkTitleAndPrice"
    | "checkPillar"
    | "checkContent"
    | "checkContact"
    | "checkMedia";
  done: boolean;
  /**
   * El campo al que lleva pulsar el punto.
   *
   * Un checklist que solo informa obliga a buscar el campo a mano en tres pasos. Con esto, cada
   * línea es el atajo a lo que le falta — y el paso lo resuelve `stepForField`, no una tabla nueva.
   */
  field: string;
  /**
   * Recomendado, no obligatorio: se puede publicar sin él.
   *
   * La foto es el único así, y se marca porque la diferencia importa: quien ve cuatro pendientes
   * sin saber cuáles bloquean, cree que no puede publicar todavía.
   */
  optional?: boolean;
}

/** Lo que se lleva escrito, tal como se puede leer del formulario en cualquier momento. */
export interface PublishDraft {
  title: string;
  kind: string;
  category: string;
  price: string;
  phone: string;
  content: string;
  mediaCount: number;
}

export const EMPTY_PUBLISH_DRAFT: PublishDraft = {
  title: "",
  kind: "anuncio",
  category: "",
  price: "",
  phone: "",
  content: "",
  mediaCount: 0,
};

/**
 * Si este `kind` obliga a poner precio.
 *
 * Un evento puede ser gratis y un anuncio no vende nada; un producto y un servicio, no. Es la misma
 * regla que decide el `required` del campo en `PublishForm`, y por eso se exporta desde aquí: con la
 * condición escrita dos veces, el checklist acabaría pidiendo un precio que el formulario no exige
 * —o dando por bueno uno que sí—.
 */
export function publishRequiresPrice(kind: string): boolean {
  return kind === "producto" || kind === SERVICE_KIND;
}

/** Si este `kind` llega a enseñar el campo de precio, aunque no lo exija. */
export function publishShowsPrice(kind: string): boolean {
  return publishRequiresPrice(kind) || kind === EVENT_KIND;
}

const hasText = (value: string): boolean => value.trim().length > 0;

export function publishChecklist(
  draft: PublishDraft,
): readonly PublishChecklistItem[] {
  const needsPrice = publishRequiresPrice(draft.kind);

  return [
    {
      id: "essentials",
      /* Dos rótulos y no uno con el precio entre paréntesis: en un anuncio no hay precio que poner,
         y nombrar un campo que no existe en pantalla es una pista falsa. */
      labelKey: needsPrice ? "checkTitleAndPrice" : "checkTitle",
      done: hasText(draft.title) && (!needsPrice || hasText(draft.price)),
      field: "title",
    },
    {
      id: "pillar",
      labelKey: "checkPillar",
      done: hasText(draft.category),
      field: "category",
    },
    {
      id: "content",
      labelKey: "checkContent",
      done: hasText(draft.content),
      field: "content",
    },
    {
      id: "contact",
      labelKey: "checkContact",
      done: hasText(draft.phone),
      field: "phone",
    },
    {
      id: "media",
      labelKey: "checkMedia",
      done: draft.mediaCount > 0,
      field: "media",
      optional: true,
    },
  ];
}

/**
 * Cuántos puntos **obligatorios** quedan.
 *
 * La foto no cuenta: si contara, el checklist nunca llegaría a cero para quien decide publicar sin
 * ella, y un contador que no se puede cerrar deja de ser información y pasa a ser un reproche.
 */
export function publishBlockingCount(
  items: readonly PublishChecklistItem[],
): number {
  return items.filter((item) => !item.optional && !item.done).length;
}
