import { getTranslations } from "next-intl/server";
import type { ListingArticle } from "~/domain/outreach/listingArticles";
import CopyText from "./CopyText";
import ProductPhotos from "./ProductPhotos";

interface ListingArticlesProps {
  articles: readonly ListingArticle[];
  /** El texto completo de la línea: es la descripción de todos los artículos. */
  description: string;
}

/**
 * Lo que pide «Vender artículo» en un grupo de compraventa, un pan por tarjeta.
 *
 * La descripción se ofrece **una sola vez**, encima de las tarjetas: es la misma en todas, y
 * repetirla con su botón en cada una alargaría la página sin darle nada nuevo a quien publica.
 */
export default async function ListingArticles({
  articles,
  description,
}: ListingArticlesProps) {
  if (articles.length === 0) return null;

  const t = await getTranslations("outreach");

  return (
    <section data-testid="outreach-listings" className="mt-8">
      <h2 className="text-lg font-semibold mb-1">{t("listingsHeading")}</h2>
      <p className="mb-3 text-sm text-text-support">{t("listingsHint")}</p>

      <div data-testid="outreach-listing-description" className="mb-4">
        <p className="mb-2 text-sm">{t("listingDescription")}</p>
        <CopyText
          text={description}
          label={t("copyDescription")}
          variant="field"
        />
      </div>

      <ol className="flex flex-col gap-3">
        {articles.map((article) => (
          <li
            key={article.postId}
            data-testid="outreach-listing"
            className="rounded-card border border-separator p-4"
          >
            <dl className="mb-3 flex flex-col gap-3">
              <div>
                <dt className="text-sm text-text-support">
                  {t("listingTitle")}
                </dt>
                <dd
                  data-testid="outreach-listing-title"
                  className="mb-1 font-semibold"
                >
                  {article.title}
                </dd>
                <dd>
                  <CopyText
                    text={article.title}
                    label={t("copyTitle")}
                    variant="field"
                  />
                </dd>
              </div>
              <div>
                <dt className="text-sm text-text-support">
                  {t("listingPrice")}
                </dt>
                <dd
                  data-testid="outreach-listing-price"
                  className="mb-1 font-semibold"
                >
                  {article.price}
                </dd>
                <dd>
                  <CopyText
                    text={article.price}
                    label={t("copyPrice")}
                    variant="field"
                  />
                </dd>
              </div>
            </dl>

            <ProductPhotos title={article.title} photos={article.photos} />
          </li>
        ))}
      </ol>
    </section>
  );
}
