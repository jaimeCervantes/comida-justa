import { inArray } from "drizzle-orm";
import { practiceDaySlug } from "~/domain/practices/practiceDayPost";
import { db } from "~/infra/dataAccess/db/connection";
import { postTranslations } from "~/infra/dataAccess/db/schema/posts";

/**
 * Qué prácticas marcó hoy esta persona.
 *
 * **La huella es la publicación.** `habit_repetitions` cuenta por reto y día —esa es la unidad del
 * jardín, y no cambia—, así que no existe en la base ningún registro por práctica y día. Desde que
 * marcar publica, sí existe uno: el slug determinista de `practiceDaySlug`, que lleva persona,
 * práctica y día. Preguntar por esos slugs es preguntar «¿cuáles marqué hoy?» sin pedirle una tabla
 * nueva a `bot-whatsapp`, que es de quien depende el esquema compartido.
 *
 * Sin sesión o sin prácticas que mirar, no consulta: devuelve el conjunto vacío.
 */
export async function findPracticeKeysMarkedToday({
  userId,
  practiceKeys,
  cycleDate,
}: {
  userId: string | null;
  practiceKeys: readonly string[];
  cycleDate: string;
}): Promise<ReadonlySet<string>> {
  if (!userId || practiceKeys.length === 0) return new Set();

  const keyBySlug = new Map(
    practiceKeys.map((practiceKey) => [
      practiceDaySlug({ practiceKey, cycleDate, userId }),
      practiceKey,
    ]),
  );

  const rows = await db
    .select({ slug: postTranslations.slug })
    .from(postTranslations)
    .where(inArray(postTranslations.slug, [...keyBySlug.keys()]));

  return new Set(
    rows.flatMap(({ slug }) => {
      const practiceKey = keyBySlug.get(slug);
      return practiceKey ? [practiceKey] : [];
    }),
  );
}
