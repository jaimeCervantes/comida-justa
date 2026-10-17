import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { Heading } from "~/presentation/design_system/typography/Heading";
import type {
  ListingArticleView,
  ListingChannelStatus,
} from "~/use_cases/outreach/getOutreachKitUseCase";
import { lastPublishedLabel } from "../lastPublishedLabel";
import ChannelLinks from "./ChannelLinks";
import CopyText from "./CopyText";
import MarkPublishedForm from "./MarkPublishedForm";
import ProductPhotos from "./ProductPhotos";

interface ListingArticlesProps {
  outreachTextId: string;
  articles: readonly ListingArticleView[];
  /** Los grupos de compraventa con su turno y el pan que toca; cada artículo lleva su historial. */
  channels: readonly ListingChannelStatus[];
  /** El texto completo de la línea —la versión de hoy—: es la descripción de todos los artículos. */
  description: string;
  /** Si el texto tiene varias versiones, cuál toca hoy en la descripción, contando desde 1. */
  descriptionVersionNumber?: number;
  /** La hora con la que se cuenta «hoy»: una sola para toda la página. */
  now: Date;
  className?: string;
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
  descriptionVersionNumber,
  now,
  className,
}: ListingArticlesProps) {
  if (articles.length === 0) return null;

  const t = await getTranslations("outreach");

  return (
    <section data-testid="outreach-listings" className={cn(className)}>
      <Heading level={2} className="mb-1">
        {t("listingsHeading")}
      </Heading>
      <p className="mb-4 text-sm text-text-support">{t("listingsHint")}</p>

      <Heading level={3} className="mb-2">
        {t("listingGroupsHeading")}
      </Heading>
      {channels.length === 0 ? (
        <p className="mb-4 text-sm text-text-support">
          {t("noListingGroups")}{" "}
          <Link href="/admin/difusion/grupos" className="font-semibold">
            {t("groupsLink")}
          </Link>
        </p>
      ) : (
        <ChannelLinks
          items={channels.map(({ channel, turn, suggestion }) => ({
            channel,
            turn,
            suggestionTitle: suggestion?.title ?? null,
          }))}
        />
      )}

      <div data-testid="outreach-listing-description" className="mb-4">
        <p className="mb-2 text-sm">
          {descriptionVersionNumber
            ? t("listingDescriptionVersion", { n: descriptionVersionNumber })
            : t("listingDescription")}
        </p>
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
