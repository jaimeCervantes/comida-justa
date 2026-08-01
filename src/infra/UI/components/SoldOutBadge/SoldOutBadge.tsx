import { useTranslations } from "next-intl";
import { isSoldOut } from "~/domain/entities/post/availability";

/**
 * Marca lo que el vendedor dejó de ofrecer. No se pinta nada cuando hay existencias ni en un
 * anuncio: la regla de cuándo aplica vive en el dominio, no aquí.
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

  return (
    <span
      data-testid="sold-out-badge"
      className="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
    >
      {t("availability.soldOut")}
    </span>
  );
}
