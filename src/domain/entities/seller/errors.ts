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

export class BranchNameRequiredError extends SellerValidationError {
  constructor() {
    super("El nombre de la sucursal es obligatorio.");
    this.name = "BranchNameRequiredError";
  }
}

export class BranchAddressRequiredError extends SellerValidationError {
  constructor() {
    super("La dirección de la sucursal es obligatoria.");
    this.name = "BranchAddressRequiredError";
  }
}

/**
 * Sin coordenadas no hay sucursal: `branches.location` es `NOT NULL` y, sobre todo, es lo único
 * que permite que el chatbot recomiende por cercanía. El mensaje dice **qué hacer**, no solo que
 * algo falló.
 */
export class BranchLocationUnresolvedError extends SellerValidationError {
  constructor() {
    super(
      "No pudimos ubicar ese enlace en el mapa. Abre tu negocio en Google Maps y copia la " +
        "dirección de la barra del navegador, o toca «Usar mi ubicación actual» estando en tu local.",
    );
    this.name = "BranchLocationUnresolvedError";
  }
}

/** Editar la ficha de una tienda que no existe: quien pide no es vendedor. */
export class NotASellerError extends SellerValidationError {
  constructor() {
    super("Primero abre tu tienda.");
    this.name = "NotASellerError";
  }
}

export class AlreadyASellerError extends SellerValidationError {
  constructor(readonly handle: string | null) {
    super("Ya tienes una tienda registrada.");
    this.name = "AlreadyASellerError";
  }
}
