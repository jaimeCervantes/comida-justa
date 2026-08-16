import type { ModerationReason } from "~/domain/entities/post/moderation";

export interface ModerationRequest {
  title: string;
  content: string;
}

/**
 * Lo que contesta el clasificador.
 *
 * `accepted` o `rejected` **con un motivo de la lista cerrada**, nunca una explicación redactada:
 * el texto que ve la persona sale del catálogo de i18n. Si se devolviera prosa del modelo, el
 * contenido de una publicación —que es entrada de un desconocido— podría dictar lo que el sitio le
 * dice al usuario.
 */
export type ModerationVerdict =
  | { decision: "accepted" }
  | { decision: "rejected"; reason: ModerationReason };

/**
 * Juzga si una publicación pertenece al catálogo.
 *
 * Título y contenido **juntos**, por el mismo motivo que el traductor: "Suero natural" solo se
 * entiende sabiendo que el cuerpo habla de agua de coco después de entrenar.
 *
 * **Lanza cuando no puede juzgar.** No devuelve un tercer valor para "no sé": quien llama tiene que
 * distinguir «el modelo dijo que sí» de «el modelo no contestó», y una excepción es más difícil de
 * ignorar por accidente que una rama más de un `switch`. El caso de uso la traduce a `in_review`.
 */
export default interface IContentModerationService {
  review(request: ModerationRequest): Promise<ModerationVerdict>;
}
