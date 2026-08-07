export interface TranslationRequest {
  title: string;
  content: string;
  /** El idioma en el que está escrito el original. */
  sourceLocale: string;
  targetLocale: string;
}

export interface TranslatedText {
  title: string;
  content: string;
}

/**
 * Traduce el texto de una publicación.
 *
 * El puerto habla de **título y contenido juntos**, no de cadenas sueltas, porque traducirlos por
 * separado pierde el contexto: "Verde" solo es "Green" si el traductor sabe que el cuerpo habla de
 * un jugo. Una llamada por publicación es además una llamada en vez de dos.
 */
export default interface ITranslationService {
  translate(request: TranslationRequest): Promise<TranslatedText>;
}
