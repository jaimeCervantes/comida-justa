import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { enterOutreachAdmin, outreachMetadata } from "../adminGate";
import OutreachBreadcrumbs from "../ui/OutreachBreadcrumbs";
import { lastPublishedLabel } from "./lastPublishedLabel";
import { loadOutreachText } from "./loadOutreachText";
import ChannelLinks from "./ui/ChannelLinks";
import DailyPaceNotice from "./ui/DailyPaceNotice";
import ExcludedProducts from "./ui/ExcludedProducts";
import GroupPostTexts from "./ui/GroupPostTexts";
import ListingArticles from "./ui/ListingArticles";
import MarkPublishedForm from "./ui/MarkPublishedForm";
import ProductPhotos from "./ui/ProductPhotos";

export const generateMetadata = outreachMetadata;

/**
 * El kit de una publicación: lo que se pega en un grupo normal y lo que se llena en uno de
 * compraventa, salidos de los mismos productos.
 *
 * Se arma al pedir la página, con el precio y las existencias de ese momento. Nada aquí publica:
 * la app prepara y la persona da el clic en Facebook.
 */
export default async function DifusionKitPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = await enterOutreachAdmin(rawLocale);
  const t = await getTranslations("outreach");
  // Una sola hora para toda la página: «hoy» no puede cambiar de un grupo al siguiente.
  const now = new Date();
  const {
    text,
    kit,
    articles,
    postChannels,
    listingChannels,
    pace,
    pause,
    descriptionVersion,
  } = await loadOutreachText(id, locale, now);
  // Con una sola versión no hay turno que anunciar.
  const turnsVersions = kit.versions.length > 1;

  return (
    <main>
      <OutreachBreadcrumbs steps={[{ label: text.name }]} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{text.name}</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/difusion/grupos"
            className="font-semibold hover:text-highlight"
          >
            {t("groupsLink")}
          </Link>
          <Link
            href={{ pathname: "/admin/difusion/[id]/editar", params: { id } }}
            className="font-semibold hover:text-highlight"
          >
            {t("edit")}
          </Link>
        </div>
      </div>

      <DailyPaceNotice pace={pace} pause={pause} />

      <section data-testid="outreach-group-post">
        <h2 className="text-lg font-semibold mb-1">{t("groupPostHeading")}</h2>

        {kit.text ? (
          <>
            <p className="mb-3 text-sm text-text-support">
              {t("groupPostHint")}
            </p>
            <GroupPostTexts versions={kit.versions} />

            {/* Una foto por producto: en un grupo normal la línea entera va en una publicación. */}
            <h3 className="mt-4 mb-2 font-semibold">{t("photosHeading")}</h3>
            <div className="flex flex-wrap gap-2">
              {articles.map((article) => (
                <ProductPhotos
                  key={article.postId}
                  title={article.title}
                  photos={article.photos.slice(0, 1)}
                />
              ))}
            </div>

            <h3 className="mt-6 mb-2 font-semibold">
              {t("postGroupsHeading")}
            </h3>
            {postChannels.length === 0 ? (
              <p className="text-sm text-text-support">
                {t("noPostGroups")}{" "}
                <Link href="/admin/difusion/grupos" className="font-semibold">
                  {t("groupsLink")}
                </Link>
              </p>
            ) : (
              <>
                <ChannelLinks
                  items={postChannels.map((status) => ({
                    ...status,
                    versionNumber: turnsVersions
                      ? status.version + 1
                      : undefined,
                  }))}
                />
                <MarkPublishedForm
                  outreachTextId={text.id}
                  postId={null}
                  hint={t("markPostHint")}
                  submitLabel={t("markPostPublished")}
                  channels={postChannels.map(
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
              </>
            )}
          </>
        ) : (
          <p data-testid="outreach-nothing" className="text-text-support">
            {t("nothingToAnnounce")}
          </p>
        )}
      </section>

      {kit.text ? (
        <ListingArticles
          outreachTextId={text.id}
          articles={articles}
          channels={listingChannels}
          description={kit.versions[descriptionVersion] ?? kit.text}
          descriptionVersionNumber={
            turnsVersions ? descriptionVersion + 1 : undefined
          }
          now={now}
        />
      ) : null}

      <ExcludedProducts excluded={kit.excluded} />
    </main>
  );
}
