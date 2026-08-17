import {
  EVENT_KIND,
  isValidKind,
  SERVICE_KIND,
} from "~/domain/entities/post/kind";
import { MAX_POST_MEDIA_FILES } from "~/domain/entities/post/mediaPayload";
import { isValidOrigin } from "~/domain/entities/post/origin";
import type {
  IPostValidator,
  Post,
  User,
  VoidOrError,
} from "~/domain/entities/post/types";

/** Una fecha puede llegar como texto desde un formulario; una rota no cuenta como fecha. */
function toEventDate(value: unknown): Date | null {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(String(value));

  return Number.isNaN(date.getTime()) ? null : date;
}

export default class PostValidator implements IPostValidator {
  MIN_LENGTH_TITLE = 5;
  MIN_LENGTH_CONTENT = 15;

  validate(post: Post): VoidOrError {
    this.validateStringOnPost(
      post.title as string,
      "title",
      this.MIN_LENGTH_TITLE,
    );
    this.validateNumberOnPost(post.price, "price");
    this.validateStringOnPost(
      post.content as string,
      "content",
      this.MIN_LENGTH_CONTENT,
    );
    this.validateUser(post.user);
    this.validateKindAndOrigin(post);
    this.validateMedia(post);
  }

  /**
   * Los archivos de la publicación: forma y tope, **sin mínimo**.
   *
   * No exige que haya al menos uno a propósito. La edición valida una publicación cuyo formulario ni
   * siquiera muestra la media (`updateOnePostUseCase` pasa una lista vacía), así que un mínimo aquí
   * haría imposible corregir un título. Que publicar exija un archivo sigue siendo cierto, pero es
   * una regla del formulario —vive en `errors.media` de la Server Action, que es quien puede
   * contestarle a la persona— y no una condición para que la entidad sea coherente.
   *
   * El tope, en cambio, sí es de la entidad: la base no lo impone (no hay límite de filas en
   * `post_media`) y sin él una publicación con doscientas imágenes sería un dato válido.
   */
  private validateMedia(post: Post): VoidOrError {
    const media = post.media ?? [];

    if (!Array.isArray(media)) {
      throw new PostMediaError("La media de una publicación es una lista.");
    }

    if (media.length > MAX_POST_MEDIA_FILES) {
      throw new PostMediaError(
        `Una publicación no lleva más de ${MAX_POST_MEDIA_FILES} archivos.`,
      );
    }

    for (const file of media) {
      if (!file?.url) {
        throw new PostMediaError("Cada archivo necesita su dirección.");
      }

      if (!file.type) {
        throw new PostMediaError(
          `El archivo "${file.url}" no dice si es imagen o vídeo.`,
        );
      }
    }
  }

  /**
   * Valida los ejes de clasificación del post:
   * - `kind` (si viene) debe estar en la allowlist.
   * - un `producto` exige `price` numérico y mayor a cero, y **procedencia**.
   * - `origin` (si viene) debe estar en la allowlist. El gate de admin para `hazlo_sano_*`
   *   NO vive aquí (es autorización de la capa de aplicación, no forma del dato).
   *
   * La procedencia se exige solo en un `producto` porque solo ahí significa algo: un anuncio no
   * tiene nada cuyo origen declarar. Se exige **después** del gate de admin, así que un no-admin
   * que fuerza un `hazlo_sano_*` no termina guardando sin procedencia: se le rechaza.
   *
   * Durante el slice 1 esta regla vivió aparte, en un `validateNewPost`, porque la edición
   * validaba sin recibir el `origin` y habría roto los productos que ya existían por un campo que
   * su formulario no mostraba. El slice 2 le dio ese campo a la edición, así que el desdoble dejó
   * de tener razón de ser y la regla volvió aquí, que es donde se lee junto a la del precio.
   */
  private validateKindAndOrigin(post: Post): VoidOrError {
    if (post.kind !== undefined && !isValidKind(post.kind)) {
      throw new PostClassificationError(`Invalid kind "${String(post.kind)}".`);
    }

    if (post.kind === "producto") {
      if (
        post.price === null ||
        post.price === undefined ||
        typeof post.price !== "number" ||
        Number.isNaN(post.price) ||
        post.price <= 0
      ) {
        throw new PostClassificationError(
          "Un producto necesita un precio mayor a cero.",
        );
      }

      if (!post.origin) {
        throw new PostClassificationError(
          "Un producto necesita que digas de dónde viene.",
        );
      }
    }

    /* Un evento exige lo contrario que un producto, y por eso vive aquí al lado: la fecha es lo que
       lo convierte en evento, el precio es opcional —los gratis son lo normal— y la procedencia ni
       se menciona, porque responde "¿lo haces o lo revendes?" y eso solo significa algo en
       mercancía. Una meditación no se revende. */
    /* Un servicio exige precio como el producto y duración como nadie más: la duración es lo que
       convertirá "las 9:00" en "de 9:00 a 9:45" cuando llegue la agenda, y se pide ya para que
       ningún servicio nazca sin ella. La procedencia tampoco aplica: un masaje siempre lo das tú. */
    if (post.kind === SERVICE_KIND) {
      if (
        typeof post.price !== "number" ||
        Number.isNaN(post.price) ||
        post.price <= 0
      ) {
        throw new PostClassificationError(
          "Un servicio necesita un precio mayor a cero.",
        );
      }

      if (
        typeof post.durationMinutes !== "number" ||
        !Number.isInteger(post.durationMinutes) ||
        post.durationMinutes <= 0
      ) {
        throw new PostClassificationError(
          "Un servicio necesita decir cuánto dura, en minutos.",
        );
      }
    }

    if (post.kind === EVENT_KIND && !toEventDate(post.startsAt)) {
      throw new PostClassificationError(
        "Un evento necesita decir cuándo ocurre.",
      );
    }

    /* Lo único que se comprueba del rango es que no vaya al revés, y lo comprueba también la base
       (`posts_event_ends_after_it_starts`). Aquí para poder contestarle a quien publica en vez de
       dejar que reviente la inserción. */
    const starts = toEventDate(post.startsAt);
    const ends = toEventDate(post.endsAt);

    if (starts && ends && ends < starts) {
      throw new PostClassificationError(
        "Un evento no puede terminar antes de empezar.",
      );
    }

    if (
      post.origin !== undefined &&
      post.origin !== null &&
      !isValidOrigin(post.origin)
    ) {
      throw new PostClassificationError(
        `Invalid origin "${String(post.origin)}".`,
      );
    }
  }

  validateStringOnPost(
    value: string,
    name: string,
    minLength: number,
  ): VoidOrError {
    if (!value) {
      throw new StringOnPostError(
        value,
        `Missing ${name} prop on post entity.`,
      );
    }

    if (typeof value !== "string") {
      throw new StringOnPostError(
        value,
        `The ${name} property should be of type string.`,
      );
    }

    if (value.length < minLength) {
      throw new StringOnPostError(
        value,
        `The length of the ${name} should not be less than ${minLength}.`,
      );
    }
  }

  validateNumberOnPost(
    value: number | null | undefined,
    name: string,
  ): VoidOrError {
    if (typeof value === "undefined" || value === null) return;

    if (typeof value !== "number") {
      throw new Error(`${name} must be a number.`);
    }
  }

  validateFile(file: File) {
    if (file?.constructor.name !== "File") {
      throw new FileOnPostError(file, "file prop must be a File.");
    }
  }

  validateUser(user: User) {
    if (user?.constructor !== {}.constructor) {
      throw new UserOnPostError(user, "user should be an object");
    }

    if (typeof user?.id !== "string") {
      throw new UserOnPostError(user, "user.id should be an string");
    }
  }
}

class PostClassificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostClassificationError";
    this.message = message;
  }
}

class PostMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostMediaError";
    this.message = message;
  }
}

class FileOnPostError extends Error {
  file: File;
  constructor(value: File, message: string) {
    super(message);
    this.name = "FileOnPostEntityError";
    this.file = value;
    this.message = message;
  }
}

class StringOnPostError extends Error {
  value: string;
  constructor(value: string, message: string) {
    super(message);
    this.value = value;
    this.name = "StringOnPostEntityError";
    this.message = message;
  }
}

class UserOnPostError extends Error {
  user: User;
  constructor(user: User, message: string) {
    super(message);
    this.user = user;
    this.name = "UserOnPostEntityError";
    this.message = message;
  }
}
