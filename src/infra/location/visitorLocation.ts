import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import type { User } from "~/domain/entities/post/types";
import {
  areValidCoordinates,
  type Coordinates,
} from "~/domain/entities/seller/coordinates";
import { auth } from "~/infra/auth";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import { parseCoordinates, VISITOR_LOCATION_COOKIE } from "./locationCookie";

/**
 * Dónde está quien mira, si es que lo sabemos.
 *
 * Dos fuentes y en este orden:
 *
 * 1. **La cookie**, que es lo que compartió en el navegador. Va primero porque es lo más reciente
 *    y lo más explícito: acaba de apretar el botón.
 * 2. **`users.last_latitude`**, que la guarda el bot de WhatsApp desde la migración
 *    `69113f019ca5`. Es la que hace que alguien que ya habló con el bot vea distancias sin que el
 *    sitio le pida nada.
 *
 * `null` cuando no hay ninguna, y `null` es una respuesta de primera clase: quien no comparte su
 * ubicación no ve distancias y el listado le sale por fecha, sin ruegos ni pantallas a medias.
 *
 * El nombre y el formato de la cookie viven aparte, en `locationCookie.ts`, porque este módulo
 * arrastra `next-auth` y la suite de Playwright necesita la constante sin arrastrarlo.
 */
export async function readVisitorLocation(): Promise<Coordinates | null> {
  const fromCookie = parseCoordinates(
    (await cookies()).get(VISITOR_LOCATION_COOKIE)?.value,
  );

  if (fromCookie) return fromCookie;

  return await readLocationFromAccount();
}

async function readLocationFromAccount(): Promise<Coordinates | null> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) return null;

  const rows = await db
    .select({
      latitude: users.lastLatitude,
      longitude: users.lastLongitude,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const stored = rows[0];

  if (!stored?.latitude || !stored?.longitude) return null;

  const parsed = {
    latitude: Number(stored.latitude),
    longitude: Number(stored.longitude),
  };

  return areValidCoordinates(parsed) ? parsed : null;
}
