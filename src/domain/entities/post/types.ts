import type { PostKind } from "./kind";
import type { PostOrigin } from "./origin";

export type VoidOrError = void | never;
export type Post = {
  title?: string;
  slug?: string;
  content?: string;
  translations?: Record<string, any>;
  price?: number | null;
  /** Qué es: "anuncio" (default) o "producto" (requiere precio). */
  kind?: PostKind;
  /** De dónde/quién viene. `null`/ausente = comunidad sin especificar. */
  origin?: PostOrigin | null;
  /** Clave del catálogo (`categories.key`), nunca la etiqueta: esa depende del idioma. */
  category?: string | null;
  subCategory?: string | null;
  contactInfo: {
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  media: {
    url: string;
    type: "image" | "video" | string;
    alt?: string;
  };
  user: User;
  createdAt: Date;
};

export type User = {
  id: string;
  email?: string;
  name?: string;
  image?: string;
};

export interface IPostValidator {
  MIN_LENGTH_TITLE: number;
  MIN_LENGTH_CONTENT: number;

  validate(post: Post): VoidOrError;
  validateStringOnPost(
    value: string,
    name: string,
    minLength: number
  ): VoidOrError;
  validateNumberOnPost(value: number, name: string): VoidOrError;
  validateFile(file: File): VoidOrError;
  validateUser(user: User): VoidOrError;
}

export interface IPostEntity {
  generateSlug(title: string): string;
}
