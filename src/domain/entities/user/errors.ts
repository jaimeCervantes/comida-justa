/**
 * Errores esperados del perfil público. Como en el alta de vendedor, son las maneras razonables en
 * que una petición legítima no procede, y cada una tiene que llegar al formulario como una frase
 * accionable en vez de como un 500 de Postgres.
 */
export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserValidationError";
  }
}

export class UsernameUnusableError extends UserValidationError {
  constructor() {
    super(
      "Ese nombre no se puede usar como dirección. Usa al menos tres letras o números.",
    );
    this.name = "UsernameUnusableError";
  }
}

/** Protege el índice único `ix_users_username` que creó la migración 0027. */
export class UsernameTakenError extends UserValidationError {
  constructor(readonly username: string) {
    super("Ese nombre de usuario ya está ocupado. Prueba con otro.");
    this.name = "UsernameTakenError";
  }
}

/**
 * Cambiar de nombre rompería los enlaces que la persona ya compartió, así que por ahora se
 * reclama una vez. Renombrar con redirección es trabajo aparte.
 */
export class UsernameAlreadySetError extends UserValidationError {
  constructor(readonly username: string) {
    super("Ya tienes una dirección personal.");
    this.name = "UsernameAlreadySetError";
  }
}
