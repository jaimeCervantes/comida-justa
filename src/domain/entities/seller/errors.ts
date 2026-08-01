/**
 * Errores esperados del alta de vendedor. No son bugs: son las cuatro maneras razonables en que
 * un alta legítima no procede, y cada una tiene que llegar al formulario como una frase que el
 * vendedor pueda accionar.
 *
 * Dos de ellas (`SellerHandleTakenError`, `SellerPhoneTakenError`) protegen índices únicos que ya
 * existen en la base compartida: sin ellas el usuario vería un 500 con un mensaje de Postgres.
 */
export class SellerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SellerValidationError";
  }
}

export class SellerNameRequiredError extends SellerValidationError {
  constructor() {
    super("El nombre de la tienda es obligatorio.");
    this.name = "SellerNameRequiredError";
  }
}

/** El nombre existe, pero al convertirlo en dirección web no queda nada utilizable ("###"). */
export class SellerHandleUnusableError extends SellerValidationError {
  constructor() {
    super(
      "Ese nombre no se puede convertir en una dirección web. Usa al menos tres letras o números.",
    );
    this.name = "SellerHandleUnusableError";
  }
}

export class SellerPhoneInvalidError extends SellerValidationError {
  constructor() {
    super("El teléfono debe tener 10 dígitos.");
    this.name = "SellerPhoneInvalidError";
  }
}

export class SellerHandleTakenError extends SellerValidationError {
  constructor(readonly handle: string) {
    super(
      "Ese nombre de tienda ya está ocupado. Prueba con otro o agrégale tu localidad.",
    );
    this.name = "SellerHandleTakenError";
  }
}

export class SellerPhoneTakenError extends SellerValidationError {
  constructor() {
    super("Ese teléfono ya está registrado en otra tienda.");
    this.name = "SellerPhoneTakenError";
  }
}

export class AlreadyASellerError extends SellerValidationError {
  constructor(readonly handle: string | null) {
    super("Ya tienes una tienda registrada.");
    this.name = "AlreadyASellerError";
  }
}
