"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { User } from "~/domain/entities/post/types";
import { areValidCoordinates } from "~/domain/entities/seller/coordinates";
import { auth } from "~/infra/auth";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import {
  serializeCoordinates,
  VISITOR_LOCATION_COOKIE,
  VISITOR_LOCATION_MAX_AGE,
} from "~/infra/location/locationCookie";

/**
 * Guarda la ubicación que el visitante acaba de compartir.
 *
 * Va a la cookie siempre —es lo que hace que el servidor pueda pintar distancias en el mismo
 * render— y **además** a `users.last_latitude` cuando hay sesión, que es la misma columna que
 * llena el bot de WhatsApp. Así compartirla una vez sirve en los dos lados y no hay dos verdades
 * sobre dónde está la misma persona.
 *
 * Las coordenadas se validan aquí y no solo en el cliente: llegan de un formulario, y un
 * formulario es una entrada del usuario aunque lo haya llenado el navegador.
 */
export async function shareLocation(formData: FormData): Promise<void> {
  const coordinates = {
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
  };

  if (!areValidCoordinates(coordinates)) return;

  (await cookies()).set(
    VISITOR_LOCATION_COOKIE,
    serializeCoordinates(coordinates),
    {
      maxAge: VISITOR_LOCATION_MAX_AGE,
      sameSite: "lax",
      path: "/",
    },
  );

  await rememberOnAccount(coordinates.latitude, coordinates.longitude);

  revalidatePath("/", "layout");
}

async function rememberOnAccount(
  latitude: number,
  longitude: number,
): Promise<void> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) return;

  await db
    .update(users)
    .set({
      lastLatitude: latitude,
      lastLongitude: longitude,
      locationUpdatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
