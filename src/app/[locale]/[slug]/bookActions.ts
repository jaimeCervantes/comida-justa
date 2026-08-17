"use server";
// ↑ Primera sentencia del archivo, no cosmético: debajo de un import deja de ser directiva.

import { revalidatePath } from "next/cache";
import type { User } from "~/domain/entities/post/types";
import { COMMUNITY_UTC_OFFSET_MINUTES } from "~/domain/schedule/timezone";
import { auth } from "~/infra/auth";
import { createBookAppointmentUseCase } from "~/infra/dataAccess/schedule/factory";

export interface BookActionState {
  booked?: boolean;
  error?: "slot-taken" | "not-offered" | "no-session";
}

/**
 * Pide una cita para el hueco elegido.
 *
 * El hueco viaja como dos instantes en ISO y **se vuelve a validar contra los que se ofrecen**: lo
 * que llega de un formulario es una propuesta, no un hecho. Y aun así la última palabra la tiene la
 * restricción de exclusión de la base, que es la única que gana la carrera entre dos personas
 * pulsando a la vez.
 */
export async function bookSlot(
  _prev: BookActionState,
  formData: FormData,
): Promise<BookActionState> {
  const session = await auth();
  const buyerId = (session?.user as User | undefined)?.id;

  if (!buyerId) return { error: "no-session" };

  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "not-offered" };
  }

  const durationMinutes = Number(formData.get("durationMinutes"));
  const result = await createBookAppointmentUseCase().book({
    sellerId: String(formData.get("sellerId") ?? ""),
    buyerId,
    postId: String(formData.get("postId") ?? ""),
    title: String(formData.get("title") ?? ""),
    unitPrice: Number(formData.get("unitPrice")) || 0,
    during: { startsAt, endsAt },
    durationMinutes,
    offsetMinutes: COMMUNITY_UTC_OFFSET_MINUTES,
  });

  if (!result.booked) return { error: result.reason };

  /* La ficha vuelve a pintarse sin el hueco que se acaba de ocupar, y los pedidos del vendedor
     enseñan la cita nueva. */
  revalidatePath("/pedidos");

  return { booked: true };
}
