import { getTranslations } from "next-intl/server";
import type { OutreachExclusionReason } from "~/domain/outreach/exclusionReasons";
import type { ExcludedProduct } from "~/domain/outreach/priceList";

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
 * publica sabe que hay que reponerlo, encenderlo o ponerle precio.
 */
export default async function ExcludedProducts({
  excluded,
}: {
  excluded: readonly ExcludedProduct[];
}) {
  if (excluded.length === 0) return null;

  const t = await getTranslations("outreach");

  return (
    <section data-testid="outreach-excluded" className="mt-6">
      <h2 className="text-lg font-semibold mb-1">{t("excludedHeading")}</h2>
      <p className="mb-2 text-sm text-text-support">{t("excludedIntro")}</p>
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
