import {
  generateHandle,
  type HandleRules,
  isValidHandle,
} from "~/domain/shared/publicHandle";
import { UsernameUnusableError } from "./errors";

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;

/** Lo único que la ruta `/u/...` necesita para sí misma es su paginación. */
export const RESERVED_USERNAMES: readonly string[] = ["page", "admin", "api"];

const USERNAME_RULES: HandleRules = {
  minLength: USERNAME_MIN_LENGTH,
  maxLength: USERNAME_MAX_LENGTH,
  reserved: RESERVED_USERNAMES,
};

/**
 * La dirección personal a partir de un texto (el nombre de la cuenta, o lo que la persona escriba).
 *
 * @see generateHandle — la misma regla que decide la dirección de una tienda. Los namespaces son
 * independientes (`/u/` vs `/tienda/`), así que una persona y una tienda pueden llamarse igual.
 */
export function generateUsername(source: string | null | undefined): string {
  return generateHandle(source, USERNAME_RULES);
}

export function isValidUsername(username: string): boolean {
  return isValidHandle(username, USERNAME_RULES);
}

export function resolveUsername(source: string | null | undefined): string {
  const username = generateUsername(source);

  if (!isValidUsername(username)) {
    throw new UsernameUnusableError();
  }

  return username;
}
