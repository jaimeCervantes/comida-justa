import { useTranslations } from "next-intl";
import type { Seller } from "~/domain/entities/seller/types";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { storePath } from "../storePath";

export default function StoreCard({ seller }: { seller: Seller }) {
  const t = useTranslations("account");
  const handle = seller.handle;

  return (
    <section data-testid="store-card">
      <h1 className="text-xl font-bold mb-2">{t("storeCardTitle")}</h1>
      <p className="text-2xl mb-2">{seller.name}</p>

      {seller.description ? (
        <p className="mb-4 whitespace-pre-wrap">{seller.description}</p>
      ) : null}

      {handle ? (
        <>
          <p className="mb-2">{t("becomeSellerShare")}</p>
          <Link
            href={storePath(handle)}
            className="font-bold text-pw-orange break-all"
          >
            {`${PUBLIC_BASE_URL}${storePath(handle)}`}
          </Link>
        </>
      ) : (
        // Los vendedores que creó el chatbot no tienen dirección; darles una es otro slice.
        <p>{t("storeCardNoPublicPage")}</p>
      )}
    </section>
  );
}
