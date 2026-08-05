import type { User } from "~/domain/entities/post/types";
import type { Coordinates } from "~/domain/entities/seller/coordinates";
import type { VisitorFix } from "~/domain/entities/seller/locationFreshness";
import { auth } from "~/infra/auth";
import { createSellerRepository } from "~/infra/dataAccess/sellers/factory";
import { readVisitorFix } from "./visitorLocation";

export interface ViewerLocationContext {
  /** Dónde está quien mira, o `null`. Es lo que decide si hay distancias que pintar. */
  visitor: Coordinates | null;
  /** Lo mismo, pero con la fecha: es lo que deja decir "de hace dos horas" y volver a preguntar. */
  fix: VisitorFix | null;
  /** Si conviene invitarle a abrir tienda: quien ya tiene una no necesita el consejo. */
  showSellerCta: boolean;
}

/**
 * Lo que cada sección necesita saber para hablar de cercanía.
 *
 * Las dos preguntas viajan juntas porque se hacen juntas: cuando no sabemos dónde está quien mira,
 * el aviso que lo explica es el mismo sitio donde se le dice que vender aquí exige tienda con
 * ubicación. La consulta del vendedor se **evita** cuando ya hay ubicación, porque entonces no hay
 * aviso que pintar y nadie va a leer esa invitación.
 */
export async function readViewerLocationContext(): Promise<ViewerLocationContext> {
  const fix = await readVisitorFix();

  if (fix) return { visitor: fix.coordinates, fix, showSellerCta: false };

  return { visitor: null, fix: null, showSellerCta: !(await viewerHasStore()) };
}

async function viewerHasStore(): Promise<boolean> {
  const session = await auth();
  const userId = (session?.user as User | undefined)?.id;

  // Sin cuenta no hay tienda, y la invitación es justo para quien todavía no la tiene.
  if (!userId) return false;

  return Boolean(await createSellerRepository().findByUserId(userId));
}
