import type { PostKind } from "./kind";
import type { MediaDimensions } from "./mediaAspect";
import type { PostOrigin } from "./origin";

/**
 * Un archivo de una publicación.
 *
 * Estaba escrito a mano en **cuatro** sitios —aquí, en `IPostQueryRepository`, en el repositorio de
 * consultas y en el de búsqueda—, que es la razón de que añadirle un campo doliera: había que
 * acordarse de los cuatro. Vive una vez y los otros lo importan.
 *
 * Las dimensiones son opcionales y nulables porque en la base lo son: nulas en los vídeos y en lo
 * publicado antes de que el formulario las capture. Ver `mediaAspect.ts`.
 */
export type PostMediaFile = MediaDimensions & {
  url: string;
  type: "image" | "video" | string;
  alt?: string;
};

/**
 * Un validador o no devuelve nada, o lanza. Es `void` a secas: `void | never` colapsaba a lo
 * mismo, pero al escribirlo como unión el autofix de Biome lo convertía en `undefined`, que sí
 * cambia el significado (una función `void` no es asignable a una que devuelve `undefined`).
 */
// biome-ignore lint/suspicious/noConfusingVoidType: `void` es intencional y NO debe autofixearse a `undefined`; una función `void` no es asignable a una que devuelve `undefined` y eso rompe `IPostValidator`.
export type VoidOrError = void;

/** Contenido de una publicación en un idioma concreto. La clave del `Record` es el locale. */
export type PostTranslation = {
  title?: string;
  content?: string;
  slug?: string;
  seo?: {
    title: string;
    metas: Array<{ name: string; content: string }>;
  };
};

export type Post = {
  title?: string;
  slug?: string;
  content?: string;
  translations?: Record<string, PostTranslation>;
  price?: number | null;
  /** Qué es: "anuncio" (default) o "producto" (requiere precio). */
  kind?: PostKind;
  /** De dónde/quién viene. `null`/ausente = comunidad sin especificar. */
  origin?: PostOrigin | null;
  /** Clave del catálogo (`categories.key`), nunca la etiqueta: esa depende del idioma. */
  category?: string | null;
  subCategory?: string | null;
  /** La tienda que lo vende (`sellers.id`). `null` = quien publicó no tiene tienda. */
  sellerId?: string | null;
  /** `false` = agotado: sale de la tienda y el chatbot deja de recomendarlo. */
  isAvailable?: boolean;
  contactInfo: {
    phone: string;
    email?: string;
    whatsapp?: string;
  };
  media: PostMediaFile;
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
    minLength: number,
  ): VoidOrError;
  validateNumberOnPost(value: number, name: string): VoidOrError;
  validateFile(file: File): VoidOrError;
  validateUser(user: User): VoidOrError;
}

export interface IPostEntity {
  generateSlug(title: string): string;
}
