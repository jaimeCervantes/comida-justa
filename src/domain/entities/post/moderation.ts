/**
 * El estado de moderación de una publicación: quién la puede ver y por qué.
 *
 * Espeja la columna `posts.moderation_status` que crea la migración `0040_2026_08_16` del backend
 * Python. Ver `docs/features/platform/005-2026-08-16-filtro-al-publicar.md`.
 */

import { PRODUCT_KIND } from "./hazloSanoProduct";

export const MODERATION_STATUSES = [
  /** Pasó la revisión, o un admin la aprobó. La ve todo el mundo. */
  "published",
  /** No se pudo revisar, o alguien la denunció. Espera decisión. */
  "in_review",
  /** El admin —o, desde el slice 2, el clasificador— dijo que no. */
  "rejected",
] as const;

export type ModerationStatus = (typeof MODERATION_STATUSES)[number];

/**
 * Lo que se publica sigue naciendo visible.
 *
 * Es el mismo valor que el `server_default` de la columna, y a propósito: el slice 1 no cambia lo
 * que le pasa a quien publica, solo le da al admin un interruptor que antes no existía.
 */
export const DEFAULT_MODERATION_STATUS: ModerationStatus = "published";

/**
 * Por qué se bajó algo. La lista la valida la app y no la base (la columna no lleva `CHECK`),
 * porque estos motivos van a moverse conforme se vea qué intenta colarse de verdad.
 *
 * Cada valor tiene su clave en `es.json`/`en.json`. **Nunca guarda texto redactado por un modelo**:
 * lo que se le enseña a la persona sale del catálogo, no de la columna.
 */
export const MODERATION_REASONS = [
  /** No pertenece a ninguno de los cuatro pilares: vendo mi coche, alquilo cuarto, cripto. */
  "off_topic",
  /** Promesa de salud peligrosa: cura enfermedades, sustituye medicación, adelgaza sin fundamento. */
  "health_claim",
  /** Estafa, ganancia fácil, enlaces de afiliado, texto repetido. */
  "spam",
  /** Insultos, contenido sexual, discriminación. */
  "offensive",
  /** Alcohol, tabaco, vapeadores, sustancias, armas. */
  "restricted_product",
] as const;

export type ModerationReason = (typeof MODERATION_REASONS)[number];

export type PostModeration = {
  status: ModerationStatus;
  reason: ModerationReason | null;
};

type ModerationFields = {
  /** `posts.moderation_status`. Ausente en lecturas que no piden la columna. */
  moderationStatus?: string | null;
  moderationReason?: string | null;
};

export function isModerationStatus(value: unknown): value is ModerationStatus {
  return MODERATION_STATUSES.includes(value as ModerationStatus);
}

export function isModerationReason(value: unknown): value is ModerationReason {
  return MODERATION_REASONS.includes(value as ModerationReason);
}

/**
 * Interpreta lo que vino de la base.
 *
 * Un valor ausente o desconocido cae a `published`, igual que `isAvailable` trata la ausencia como
 * disponible. El motivo es el mismo: una consulta que no pidió la columna no debe hacer desaparecer
 * una publicación de la pantalla. La base ya impone la lista con su `CHECK`, así que "desconocido"
 * solo puede venir de una lectura incompleta, no de un dato corrupto.
 */
export function resolveModerationStatus(
  value: string | null | undefined,
): ModerationStatus {
  return isModerationStatus(value) ? value : DEFAULT_MODERATION_STATUS;
}

/** El motivo solo significa algo cuando hay algo que explicar. */
export function resolveModerationReason(
  value: string | null | undefined,
): ModerationReason | null {
  return isModerationReason(value) ? value : null;
}

/** ¿La ve cualquiera? Es la condición que filtra el feed, la búsqueda, el sitemap y el resto. */
export function isPubliclyVisible(post: ModerationFields): boolean {
  return resolveModerationStatus(post.moderationStatus) === "published";
}

/**
 * ¿La puede ver esta persona?
 *
 * Lo que no está publicado no desaparece para su autor: la sigue viendo, con el aviso de por qué,
 * y ese es el único camino por el que se entera. No hay correo ni notificaciones en el sitio, así
 * que si también se le ocultara a quien la escribió, nadie sabría nunca que se le bajó algo.
 */
export function canBeViewedBy(
  post: ModerationFields & { userId: string },
  viewer: { id?: string | null; isAdmin?: boolean } | null | undefined,
): boolean {
  if (isPubliclyVisible(post)) return true;
  if (viewer?.isAdmin) return true;

  return Boolean(viewer?.id) && viewer?.id === post.userId;
}

/** Lo que un admin puede hacer desde el panel. */
export type ModerationDecision =
  | { action: "approve" }
  | { action: "reject"; reason: ModerationReason };

/**
 * Qué queda guardado tras una decisión del panel.
 *
 * Aprobar **borra el motivo**: dejarlo puesto haría que una publicación restituida siguiera
 * cargando la explicación de por qué se bajó, y esa explicación es justamente lo que se pinta.
 */
export function applyModerationDecision(
  decision: ModerationDecision,
): PostModeration {
  if (decision.action === "approve") {
    return { status: "published", reason: null };
  }

  return { status: "rejected", reason: decision.reason };
}

/**
 * Qué hacer con el interruptor que el chatbot sí mira.
 *
 * El bot es otro proceso sobre la misma base y no conoce `moderation_status`: consulta
 * `WHERE kind = 'producto' AND is_available`. O sea que **nunca ve los anuncios** —un anuncio
 * bajado no necesita nada— y a los productos los gatea con `is_available`, que el sitio ya sabe
 * escribir. Bajar un producto lo silencia para el bot sin tocar una línea de Python.
 *
 * No es un booleano porque hay **tres** respuestas, y la tercera importa: en un anuncio no se
 * toca nada. `is_available` en un anuncio no significa nada (ver `isSellable`), y escribirlo
 * ensuciaría una columna con un dato sin sentido.
 */
export type ChatbotVisibility = "silence" | "restore" | "leave";

export function chatbotVisibilityFor(post: {
  kind?: string | null;
  moderationStatus?: string | null;
}): ChatbotVisibility {
  if (post.kind !== PRODUCT_KIND) return "leave";

  return isPubliclyVisible(post) ? "restore" : "silence";
}

/**
 * Nota sobre `restore`, que es una decisión con un costo.
 *
 * `is_available` tiene dos dueños: el vendedor lo usa para decir "se me acabó" y aquí se usa para
 * silenciar lo bajado. Al restituir no hay forma de saber cuál de los dos lo apagó, así que se
 * elige encenderlo.
 *
 * El caso que se rompe —un producto que YA estaba agotado, se baja y se restituye— vuelve a
 * ofrecerse aunque no haya existencias, que es exactamente lo que pasaba antes de esta feature y
 * el vendedor corrige en un clic desde su tarjeta. La alternativa era dejarlo apagado y enseñar
 * "Agotado" en el sitio público sobre algo que nunca se agotó: una mentira visible, y en todos los
 * casos en vez de en uno raro.
 */

/**
 * Una denuncia de la comunidad.
 *
 * Habla el **mismo vocabulario cerrado** que el clasificador (`MODERATION_REASONS`): que quien
 * denuncia, el modelo y el panel usen las mismas cinco palabras es lo que permite leer las tres
 * cosas juntas sin traducir nada por el camino.
 */
export type PostReport = {
  postId: string;
  reporterId: string;
  reason: ModerationReason;
};

/**
 * ¿Esta persona puede denunciar esta publicación?
 *
 * Tres condiciones, y cada una tapa un agujero distinto:
 *
 * - **Con sesión.** Sin identidad no hay a qué aplicarle el "una por persona", y la cuenta dejaría
 *   de significar cuánta gente distinta avisó — que es todo lo que el número aporta.
 * - **No siendo su autor.** Denunciarse a uno mismo no es un aviso; quien quiera bajar lo suyo lo
 *   edita o lo borra.
 * - **Solo lo que está publicado.** Lo que ya está bajado o en revisión no necesita que nadie
 *   avise: ya está en el panel.
 */
export function canBeReportedBy(
  post: ModerationFields & { userId: string },
  viewer: { id?: string | null } | null | undefined,
): boolean {
  if (!viewer?.id) return false;
  if (viewer.id === post.userId) return false;

  return isPubliclyVisible(post);
}

/**
 * Una denuncia **no cambia el estado** de la publicación.
 *
 * Se descartó lo contrario —que mandara a `in_review`, o sea que ocultara— porque convierte el
 * botón en un arma: cualquiera podría vaciar el catálogo denunciando una publicación tras otra.
 *
 * El daño no es simétrico. Una denuncia falsa que oculta le quita la venta a un vendedor real en el
 * acto; una legítima esperando a que el admin la mire cuesta unas horas de una publicación mala
 * arriba, y esa ya pasó por el clasificador, así que no es de las evidentes.
 *
 * Existe como función y no como comentario para que la regla se pueda probar y para que quien
 * quiera cambiarla tenga que venir aquí a discutirla.
 */
export function statusAfterReport(current: ModerationStatus): ModerationStatus {
  return current;
}
