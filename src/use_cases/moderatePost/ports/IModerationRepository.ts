import type {
  ChatbotVisibility,
  ModerationReason,
  ModerationStatus,
} from "~/domain/entities/post/moderation";

/** Una publicación esperando decisión, tal y como la enseña el panel. */
export interface ModeratedPost {
  id: string;
  slug: string;
  title: string;
  kind: string;
  status: ModerationStatus;
  reason: ModerationReason | null;
  authorName: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
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
  /** Lo que no está publicado, lo más reciente primero. Es la bandeja del panel. */
  findPendingReview(): Promise<ModeratedPost[]>;
  findById(postId: string): Promise<ModeratedPost | null>;
  applyDecision(update: ModerationUpdate): Promise<void>;
}
