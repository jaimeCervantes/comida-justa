import { useLocale, useTranslations } from "next-intl";
import type { Seller } from "~/domain/entities/seller/types";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { storeHref, storePath } from "../storePath";
import AccountCard from "./AccountCard";
import PublicAddressRow from "./PublicAddressRow";

export default function StoreCard({ seller }: { seller: Seller }) {
  const t = useTranslations("account");
  const locale = resolveLocale(useLocale());
  const handle = seller.handle;

  return (
    <AccountCard title={t("storeCardTitle")} testId="store-card">
      <p className="text-2xl font-medium">{seller.name}</p>

      {seller.description ? (
        <p className="mt-2 whitespace-pre-wrap">{seller.description}</p>
      ) : null}

      {handle ? (
        <>
          <p className="mt-4 mb-2">{t("becomeSellerShare")}</p>
          <PublicAddressRow
            href={storeHref(handle)}
            path={storePath(handle, locale)}
            shareUrl={`${PUBLIC_BASE_URL}${storePath(handle, locale)}`}
            shareTitle={seller.name}
            shareText={t("shareStoreText", { name: seller.name })}
            shareTestId="share-store"
          />
        </>
      ) : (
        // Los vendedores que creó el chatbot no tienen dirección; darles una es otro slice.
        <p className="mt-4">{t("storeCardNoPublicPage")}</p>
      )}
    </AccountCard>
  );
}
