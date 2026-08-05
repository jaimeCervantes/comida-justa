import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "~/domain/entities/post/types";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import { areValidCoordinates } from "~/domain/entities/seller/coordinates";
import {
  fresherOf,
  type VisitorFix,
} from "~/domain/entities/seller/locationFreshness";
import { auth } from "~/infra/auth";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import { parseFix, VISITOR_LOCATION_COOKIE } from "./locationCookie";

/**
 * Dónde está quien mira, si es que lo sabemos, y **desde cuándo**.
 *
 * Dos fuentes:
 *
 * 1. **La cookie**, que es lo que compartió en el navegador.
 * 2. **`users.last_latitude`**, que la guarda el bot de WhatsApp desde la migración
 *    `69113f019ca5`. Es la que hace que alguien que ya habló con el bot vea distancias sin que el
 *    sitio le pida nada.
 *
 * **Gana la más reciente, no la cookie por ser cookie.** Antes la cookie ganaba siempre, y eso
 * producía un fallo silencioso: quien compartía su ubicación con el bot desde otra ciudad seguía
 * viendo el sitio medido desde su casa, porque su cookie de hace meses no la desbancaba nada. La
 * columna `location_updated_at` se venía escribiendo desde entonces sin que nadie la leyera; esto
 * es lo que la lee.
 *
 * En un empate manda la cookie: es la que alguien puso explícitamente en este navegador. Una cookie
 * sin fecha —las del formato anterior, que duran un año— también manda, para que cambiar el formato
 * no le cambie el sitio a quien ya tiene una.
 *
 * `null` cuando no hay ninguna, y `null` es una respuesta de primera clase: quien no comparte su
 * ubicación no ve distancias y el listado le sale por fecha, sin ruegos ni pantallas a medias.
 *
 * El nombre y el formato de la cookie viven aparte, en `locationCookie.ts`, porque este módulo
 * arrastra `next-auth` y la suite de Playwright necesita la constante sin arrastrarlo.
 *
 * Va envuelto en `cache()` porque ahora hay **dos** lectores por petición: el layout, que alimenta
 * al refrescador, y la página, que necesita desde dónde medir. Sin esto, cada página pagaría dos
 * veces la sesión y la consulta a `users`.
 */
export const readVisitorFix = cache(async (): Promise<VisitorFix | null> => {
  const fromCookie = parseFix(
    (await cookies()).get(VISITOR_LOCATION_COOKIE)?.value,
  );

  /* Sin cuenta no hay columna que consultar: `readFixFromAccount` se corta en la sesión. */
  return fresherOf(fromCookie, await readFixFromAccount());
});

/** Las coordenadas a secas, para las páginas que solo necesitan desde dónde medir. */
export async function readVisitorLocation(): Promise<Coordinates | null> {
  return (await readVisitorFix())?.coordinates ?? null;
}

async function readFixFromAccount(): Promise<VisitorFix | null> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) return null;

  const rows = await db
    .select({
      latitude: users.lastLatitude,
      longitude: users.lastLongitude,
      updatedAt: users.locationUpdatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const stored = rows[0];

  if (!stored?.latitude || !stored?.longitude) return null;

  const coordinates = {
    latitude: Number(stored.latitude),
    longitude: Number(stored.longitude),
  };

  if (!areValidCoordinates(coordinates)) return null;

  return { coordinates, fixedAt: stored.updatedAt ?? null };
}
