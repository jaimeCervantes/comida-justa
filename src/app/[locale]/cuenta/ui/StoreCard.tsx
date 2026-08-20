import { useLocale, useTranslations } from "next-intl";
import type { Seller } from "~/domain/entities/seller/types";
import { Link } from "~/i18n/navigation";
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

      {/* La agenda vive aquí y no en el menú del avatar porque solo le sirve a quien tiene tienda,
          y esta tarjeta es justo la que solo se pinta cuando la hay. Sin este enlace la pantalla
          existía pero no se llegaba a ella salvo escribiendo la dirección a mano. */}
      <p className="mt-6">
        <Link
          href="/cuenta/agenda"
          className="underline text-pw-green hover:text-highlight"
          data-testid="schedule-link"
        >
          {t("scheduleLink")}
        </Link>
        <span className="block text-sm text-text-support">
          {t("scheduleLinkHint")}
        </span>
      </p>
    </AccountCard>
  );
}
