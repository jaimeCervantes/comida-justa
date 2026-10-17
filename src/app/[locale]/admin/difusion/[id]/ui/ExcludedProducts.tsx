import { getTranslations } from "next-intl/server";
import type { OutreachExclusionReason } from "~/domain/outreach/exclusionReasons";
import type { ExcludedProduct } from "~/domain/outreach/priceList";
import { Heading } from "~/presentation/design_system/typography/Heading";

/** Una clave por motivo, escrita entera para que se encuentre con grep. */
const REASON_KEYS = {
  "not-published": "reasonNotPublished",
  "out-of-stock": "reasonOutOfStock",
  unavailable: "reasonUnavailable",
  "no-price": "reasonNoPrice",
} as const satisfies Record<OutreachExclusionReason, string>;

/**
 * Lo que está en la publicación pero hoy no se anuncia, y por qué.
 *
 * Sin este aviso, un pan que desaparece del texto parecería un error de la app; con él, quien
 * publica sabe que hay que reponerlo, encenderlo o ponerle precio. Va arriba, como aviso y no al
 * final: es lo primero que conviene arreglar antes de copiar nada.
 */
export default async function ExcludedProducts({
  excluded,
}: {
  excluded: readonly ExcludedProduct[];
}) {
  if (excluded.length === 0) return null;

  const t = await getTranslations("outreach");

  return (
    <section
      data-testid="outreach-excluded"
      className="mb-4 rounded-control border border-feedback-warning-ink/25 bg-feedback-warning-soft p-4 text-feedback-warning-ink"
    >
      <Heading level={2} size="xs" tone="inherit" className="mb-1">
        {t("excludedHeading")}
      </Heading>
      <p className="mb-2 text-sm">{t("excludedIntro")}</p>
      <ul className="list-disc pl-5">
        {excluded.map((product) => (
          <li key={product.postId}>
            {t("excludedItem", {
              label: product.label,
              reason: t(REASON_KEYS[product.reason]),
            })}
          </li>
        ))}
      </ul>
    </section>
  );
}
