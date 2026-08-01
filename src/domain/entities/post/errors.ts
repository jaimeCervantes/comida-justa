/**
 * Errores esperados al administrar una publicación propia.
 *
 * `PostOwnershipError` es autorización, no validación: se comprueba **en el servidor** aunque la
 * UI ya oculte los controles, porque ocultar un botón no impide armar el request a mano.
 */
export class PostAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PostAdminError";
  }
}

export class PostNotFoundError extends PostAdminError {
  constructor() {
    super("Esa publicación ya no existe.");
    this.name = "PostNotFoundError";
  }
}

export class PostOwnershipError extends PostAdminError {
  constructor() {
    super("Solo quien publicó puede editar esta publicación.");
    this.name = "PostOwnershipError";
  }
}
