import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import type { ListingArticleView } from "~/use_cases/outreach/getOutreachKitUseCase";
import type { OutreachChannel } from "~/use_cases/outreach/ports/IOutreachChannelRepository";
import { lastPublishedLabel } from "../lastPublishedLabel";
import ChannelLinks from "./ChannelLinks";
import CopyText from "./CopyText";
import MarkPublishedForm from "./MarkPublishedForm";
import ProductPhotos from "./ProductPhotos";

interface ListingArticlesProps {
  outreachTextId: string;
  articles: readonly ListingArticleView[];
  /** Los grupos de compraventa, para abrirlos; cada artículo lleva su historial en ellos. */
  channels: readonly OutreachChannel[];
  /** El texto completo de la línea: es la descripción de todos los artículos. */
  description: string;
  /** La hora con la que se cuenta «hoy»: una sola para toda la página. */
  now: Date;
}

/**
 * Lo que pide «Vender artículo» en un grupo de compraventa, un pan por tarjeta.
 *
 * La descripción y los grupos se ofrecen **una sola vez**, encima de las tarjetas: son los mismos
 * para todas. Lo que cambia por pan es el título, el precio, las fotos y dónde quedó ya cada uno.
 */
export default async function ListingArticles({
  outreachTextId,
  articles,
  channels,
  description,
  now,
}: ListingArticlesProps) {
  if (articles.length === 0) return null;

  const t = await getTranslations("outreach");

  return (
    <section data-testid="outreach-listings" className="mt-8">
      <h2 className="text-lg font-semibold mb-1">{t("listingsHeading")}</h2>
      <p className="mb-3 text-sm text-text-support">{t("listingsHint")}</p>

      <h3 className="mb-2 font-semibold">{t("listingGroupsHeading")}</h3>
      {channels.length === 0 ? (
        <p className="mb-4 text-sm text-text-support">
          {t("noListingGroups")}{" "}
          <Link href="/admin/difusion/grupos" className="font-semibold">
            {t("groupsLink")}
          </Link>
        </p>
      ) : (
        <ChannelLinks channels={channels} />
      )}

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

            {article.channels.length > 0 ? (
              <div className="mt-4">
                <MarkPublishedForm
                  outreachTextId={outreachTextId}
                  postId={article.postId}
                  hint={t("markListingHint")}
                  submitLabel={t("markListingPublished")}
                  channels={article.channels.map(
                    ({ channel, lastPublishedAt }) => ({
                      id: channel.id,
                      name: channel.name,
                      lastPublished: lastPublishedLabel(
                        t,
                        lastPublishedAt,
                        now,
                      ),
                    }),
                  )}
                />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
