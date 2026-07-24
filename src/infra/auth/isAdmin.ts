/**
 * Determina si un correo pertenece a un administrador de Hazlo Sano.
 *
 * No se introduce un sistema de roles: la lista de admins vive en la variable de entorno
 * `HAZLO_SANO_ADMIN_EMAILS` (correos separados por coma). La comparación es case-insensitive.
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;

  const admins = (process.env.HAZLO_SANO_ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.trim().toLowerCase());
}
