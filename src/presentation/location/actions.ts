"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { User } from "~/domain/entities/post/types";
import {
  areValidCoordinates,
  type Coordinates,
} from "~/domain/entities/seller/coordinates";
import { auth } from "~/infra/auth";
import { db } from "~/infra/dataAccess/db/connection";
import { users } from "~/infra/dataAccess/db/schema/auth";
import {
  serializeFix,
  VISITOR_LOCATION_COOKIE,
  VISITOR_LOCATION_MAX_AGE,
} from "~/infra/location/locationCookie";

/**
 * Guarda la ubicación que el visitante acaba de compartir apretando un botón.
 *
 * Va a la cookie siempre —es lo que hace que el servidor pueda pintar distancias en el mismo
 * render— y **además** a `users.last_latitude` cuando hay sesión, que es la misma columna que
 * llena el bot de WhatsApp. Así compartirla una vez sirve en los dos lados y no hay dos verdades
 * sobre dónde está la misma persona.
 *
 * Las coordenadas se validan aquí y no solo en el cliente: llegan de un formulario, y un
 * formulario es una entrada del usuario aunque lo haya llenado el navegador.
 *
 * Un clic explícito **siempre** escribe, sin filtro de distancia ni de antigüedad: quien aprieta el
 * botón está pidiendo que se corrija ahora, y decirle que no porque "casi no te moviste" sería
 * ignorar la única señal inequívoca que tenemos. El filtro es para lo que pasa solo, y vive en
 * `refreshLocation`.
 */
export async function shareLocation(formData: FormData): Promise<void> {
  const coordinates = {
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
  };

  if (!areValidCoordinates(coordinates)) return;

  await rememberLocation(coordinates);

  revalidatePath("/", "layout");
}

/**
 * Escribe una ubicación en los dos sitios donde vive, con la misma fecha en ambos.
 *
 * La fecha se calcula una sola vez a propósito: la cookie y la columna tienen que poder compararse
 * entre sí (`fresherOf`), y dos `new Date()` distintos harían que la misma escritura pareciera dos
 * momentos.
 */
async function rememberLocation(coordinates: Coordinates): Promise<void> {
  const fixedAt = new Date();

  (await cookies()).set(
    VISITOR_LOCATION_COOKIE,
    serializeFix({ coordinates, fixedAt }),
    {
      maxAge: VISITOR_LOCATION_MAX_AGE,
      sameSite: "lax",
      path: "/",
    },
  );

  await rememberOnAccount(coordinates, fixedAt);
}

async function rememberOnAccount(
  coordinates: Coordinates,
  fixedAt: Date,
): Promise<void> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  if (!userId) return;

  await db
    .update(users)
    .set({
      lastLatitude: coordinates.latitude,
      lastLongitude: coordinates.longitude,
      locationUpdatedAt: fixedAt,
    })
    .where(eq(users.id, userId));
}
