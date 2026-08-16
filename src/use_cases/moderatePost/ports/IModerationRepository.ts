import type {
  ChatbotVisibility,
  ModerationReason,
  ModerationStatus,
  PostReport,
} from "~/domain/entities/post/moderation";

/** Una publicación esperando decisión, tal y como la enseña el panel. */
export interface ModeratedPost {
  id: string;
  slug: string;
  title: string;
  kind: string;
  status: ModerationStatus;
  reason: ModerationReason | null;
  /** Quién la publicó: decide si alguien puede denunciarla (nadie se denuncia a sí mismo). */
  authorId: string;
  authorName: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  /**
   * Cuántas **personas distintas** avisaron. Lo sostiene el `UNIQUE(post_id, user_id)`; sin él, un
   * 5 podría ser una sola persona pulsando cinco veces y el número no serviría para priorizar.
   */
  reportCount: number;
}

export interface ModerationUpdate {
  postId: string;
  status: ModerationStatus;
  reason: ModerationReason | null;
  /**
   * Qué hacer con el interruptor que el chatbot sí mira.
   *
   * Lo decide `chatbotVisibilityFor` en el dominio; el repositorio solo obedece, porque "el bot
   * filtra por `is_available`" es una regla de negocio y no un detalle de SQL. `leave` no escribe
   * la columna: en un anuncio ese dato no significa nada.
   */
  chatbot: ChatbotVisibility;
}

export default interface IModerationRepository {
  /**
   * La bandeja del panel: lo que no está publicado **y** lo publicado que alguien denunció.
   *
   * Las dos cosas piden lo mismo —que una persona decida— así que viven en la misma lista. Lo
   * denunciado no está oculto: sigue en el sitio mientras espera.
   */
  findPendingReview(): Promise<ModeratedPost[]>;
  findById(postId: string): Promise<ModeratedPost | null>;
  applyDecision(update: ModerationUpdate): Promise<void>;
  /**
   * Guarda una denuncia. Devuelve `false` si esa persona ya había denunciado esa publicación —lo
   * impide el `UNIQUE`— y eso no es un error, es la respuesta.
   */
  saveReport(report: PostReport): Promise<boolean>;
}
