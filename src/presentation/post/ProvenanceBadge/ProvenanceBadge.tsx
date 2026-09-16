import { useTranslations } from "next-intl";
import {
  isHazloSanoOrigin,
  isHazloSanoOwnMadeOrigin,
  isNearbyResaleOrigin,
  isProducerOrigin,
} from "~/domain/entities/post/origin";
import { Badge } from "~/presentation/design_system/badges/Badge";

type ProvenanceBadgeProps = {
  origin: string | null | undefined;
  className?: string;
};

/**
 * La clave de la insignia según el `origin`. `null` cuando no aplica ninguna.
 *
 * Un `productor` **no** presume locación: si es local o no lo dice la distancia de su sucursal
 * (`proximity.ts`), y una tarjeta de listado no va a arrastrar un `ST_Distance` por fila. Así que
 * afirma lo que sí respalda el dato que tiene —lo hace quien lo vende— y la locación se resuelve
 * donde importa: el directorio de productores.
 *
 * Lo de Hazlo Sano es distinto: su única sucursal **es** el ancla de la comunidad, así que no hace
 * falta esa cautela para afirmar "Local" — y se pide que la insignia lo diga así, sin nombrar la
 * marca, que ya la dice el logo de al lado. Por eso se comprueba **antes** que
 * `isHazloSanoOrigin`: solo lo que Hazlo Sano hace ella misma cae aquí; lo que revende sigue
 * anunciándose como "🌿 Hazlo Sano".
 */
function badgeKey(
  origin: string | null | undefined,
): "provenance.hazloSano" | "provenance.producer" | "provenance.local" | null {
  if (isHazloSanoOwnMadeOrigin(origin)) return "provenance.local";
  if (isHazloSanoOrigin(origin)) return "provenance.hazloSano";
  if (isProducerOrigin(origin)) return "provenance.producer";
  if (isNearbyResaleOrigin(origin)) return "provenance.local";
  return null;
}

/**
 * Es la única insignia con `emphasis="strong"`: la procedencia es la afirmación de confianza de la
 * tarjeta y tiene que pesar más que la categoría o la disponibilidad.
 */
export default function ProvenanceBadge({
  origin,
  className = "",
}: ProvenanceBadgeProps) {
  const t = useTranslations("vocabulary");
  const key = badgeKey(origin);

  if (!key) return null;

  return (
    <Badge
      tone="brand"
      emphasis="strong"
      className={className}
      data-testid="provenance-badge"
    >
      {t(key)}
    </Badge>
  );
}
