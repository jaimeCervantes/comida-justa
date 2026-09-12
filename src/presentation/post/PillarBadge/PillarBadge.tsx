import { useTranslations } from "next-intl";
import {
  publicationPillarForCategory,
  publicationPillarNumber,
} from "~/domain/entities/post/publicationPillars";
import { Badge, BadgeCounter } from "~/presentation/design_system/badges/Badge";

/**
 * A qué pilar pertenece una publicación, encima de su foto.
 *
 * Es la insignia de la pantalla 5.2 del canvas de v2: en el feed, lo primero que se mira es la
 * imagen, y ahí es donde el pilar tiene que estar para que la cuadrícula se lea de un vistazo. En la
 * fila de datos —junto a la categoría, la procedencia y la distancia— competía con todo lo demás.
 *
 * **El número acompaña siempre al color.** `pillarPalette.contrast.test.ts` dejó medido que
 * Movimiento (`#3c7b0f`) y Mente (`#0369a1`) contrastan 1.14 entre sí como tinta: quien no distingue
 * el tono necesita el número. Lo pone `BadgeCounter`, que es la misma pieza que usa el filtro de
 * pilares, así que los dos sitios se ven iguales.
 *
 * **No pinta nada cuando no hay pilar.** Los anuncios de la base van sin categoría, y una categoría
 * que no cuelga de ninguno de los cuatro tampoco tiene pilar. Ahí se calla, en vez de inventar uno.
 */
export default function PillarBadge({
  category,
  className = "",
}: {
  /** La categoría **raíz** de la publicación, tal como la entrega el mapper. */
  category?: string | null;
  className?: string;
}): React.ReactNode {
  const t = useTranslations("publicationPillars");
  const pillar = publicationPillarForCategory(category);

  if (!pillar) return null;

  return (
    <Badge
      tone={pillar}
      emphasis="strong"
      data-testid="card-pillar"
      /* Sobre una foto, el par `soft`/`ink` del pilar no tiene su fondo garantizado: la imagen
         puede ser de cualquier color. El fondo propio de la insignia es lo que le devuelve el
         contraste que su par ya tenía medido. */
      className={`shadow-sm ${className}`}
    >
      <BadgeCounter tone={pillar}>
        {publicationPillarNumber(pillar)}
      </BadgeCounter>
      {/* En la tarjeta horizontal la foto es una miniatura de ~143px y el nombre del pilar no
          cabe encima: se sale por el borde. Queda el número, que es el dato que
          `pillarPalette.contrast.test.ts` dejó como imprescindible —Movimiento y Mente contrastan
          1.14 entre sí como tinta, así que quien no distingue el tono lo necesita—, y el nombre
          sigue ahí para quien escucha.

          La condición mira el ancho de **la tarjeta**, no el de la ventana, y sólo se activa
          dentro de una: fuera de un `@container` no hay contra qué resolverla, así que donde esta
          insignia se use sin tarjeta alrededor el nombre se sigue leyendo. */}
      <span className="@min-[320px]:sr-only">{t(pillar)}</span>
    </Badge>
  );
}
