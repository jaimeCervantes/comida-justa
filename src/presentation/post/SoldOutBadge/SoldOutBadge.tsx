import { useTranslations } from "next-intl";
import { isSoldOut } from "~/domain/entities/post/availability";
import { SERVICE_KIND } from "~/domain/entities/post/kind";
import { Badge } from "~/presentation/design_system/badges/Badge";

/**
 * Marca lo que el vendedor dejó de ofrecer. No se pinta nada cuando hay existencias ni en un
 * anuncio: la regla de cuándo aplica vive en el dominio, no aquí.
 *
 * La forma del chip vive en `Badge`; aquí solo queda la regla de negocio y la traducción.
 */
export default function SoldOutBadge({
  kind,
  isAvailable,
}: {
  kind?: string | null;
  isAvailable?: boolean | null;
}) {
  const t = useTranslations("vocabulary");

  if (!isSoldOut({ kind, isAvailable })) return null;

  /* "Agotado" es verdad de una mercancía y mentira de un servicio: a una masajista no se le acaban
     los masajes, deja de ofrecerlos. Mismo interruptor, dos frases — igual que `origin` tiene un
     nombre para el reporte y una pregunta para el formulario. */
  const label =
    kind === SERVICE_KIND
      ? t("availability.notOffered")
      : t("availability.soldOut");

  return (
    <Badge tone="neutral" data-testid="sold-out-badge">
      {label}
    </Badge>
  );
}
