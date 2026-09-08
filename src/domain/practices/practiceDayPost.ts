/**
 * El slug de la publicación de un día de práctica, sea del ritual de un pilar o del catálogo.
 *
 * Es determinista a propósito, y es también el mecanismo antiduplicado: practicar dos veces lo mismo
 * el mismo día produce el mismo slug, así que quien publica puede comprobar si ya existe en vez de
 * necesitar una columna nueva en la base compartida —que es de `bot-whatsapp`— para llevar la cuenta.
 *
 * La persona entra como huella y no como id: el slug es una URL pública, y el id de cuenta no tiene
 * por qué viajar en ella. El prefijo `practica-` no es decorativo: es el que ya identifica a las
 * publicaciones de práctica, incluido el barrido que limpia la base tras la suite e2e.
 */
export function practiceDaySlug({
  practiceKey,
  cycleDate,
  userId,
}: {
  practiceKey: string;
  cycleDate: string;
  userId: string;
}): string {
  return `practica-${practiceKey}-${cycleDate}-${fingerprint(userId)}`;
}

/** La clave con la que un ritual de pilar nombra su práctica del día. */
export function ritualPracticeKey(challengeKey: string): string {
  return `ritual-${challengeKey}`;
}

/** FNV-1a de 32 bits, en base 36: corto, estable y sin dependencias. */
function fingerprint(userId: string): string {
  let hash = 2166136261;

  for (let index = 0; index < userId.length; index += 1) {
    hash ^= userId.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
