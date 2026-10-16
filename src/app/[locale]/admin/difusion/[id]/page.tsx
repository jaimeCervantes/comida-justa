import { getTranslations } from "next-intl/server";
import { dueChannels } from "~/domain/outreach/rhythm";
import { Link } from "~/i18n/navigation";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { enterOutreachAdmin, outreachMetadata } from "../adminGate";
import OutreachBreadcrumbs from "../ui/OutreachBreadcrumbs";
import { lastPublishedLabel } from "./lastPublishedLabel";
import { loadOutreachText } from "./loadOutreachText";
import ChannelDetails from "./ui/ChannelDetails";
import DailyPaceNotice from "./ui/DailyPaceNotice";
import ExcludedProducts from "./ui/ExcludedProducts";
import GroupPostTexts from "./ui/GroupPostTexts";
import ListingArticles from "./ui/ListingArticles";
import MarkPublishedForm from "./ui/MarkPublishedForm";
import OutreachStep from "./ui/OutreachStep";
import ProductPhotos from "./ui/ProductPhotos";

export const generateMetadata = outreachMetadata;

/** Separa las secciones de cada tipo de grupo: se leen como dos partes, no como una sola lista. */
const SECTION = "mt-10 border-t border-separator pt-6";

/**
 * El kit de una publicación: lo que se pega en un grupo normal y lo que se llena en uno de
 * compraventa, salidos de los mismos productos.
 *
 * Se arma al pedir la página, con el precio y las existencias de ese momento. Nada aquí publica:
 * la app prepara y la persona da el clic en Facebook.
 *
 * Se lee de arriba abajo en el orden en que se trabaja: cómo va el día, qué falta arreglar, y luego
 * cada tipo de grupo con sus pasos. En grupos normales cada grupo es **un solo renglón** —enlace,
 * turno, reglas y casilla—: antes salía dos veces, una para abrirlo y otra para marcarlo.
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
  const due = dueChannels(
    [...postChannels, ...listingChannels].map(({ turn }) => turn),
  );

  return (
    <main>
      <OutreachBreadcrumbs steps={[{ label: text.name }]} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Heading level={1}>{text.name}</Heading>
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

      <DailyPaceNotice pace={pace} pause={pause} due={due} />

      <ExcludedProducts excluded={kit.excluded} />

      <section data-testid="outreach-group-post" className={SECTION}>
        <Heading level={2} className="mb-1">
          {t("groupPostHeading")}
        </Heading>

        {kit.text ? (
          <>
            <p className="mb-4 text-sm text-text-support">
              {t("groupPostHint")}
            </p>

            <div className="flex flex-col gap-4">
              <OutreachStep
                id="outreach-step-copy"
                heading={t("stepCopyHeading")}
              >
                <GroupPostTexts versions={kit.versions} />

                {/* Una foto por producto: en un grupo normal la línea entera va en una publicación. */}
                <p className="mt-4 mb-2 text-sm font-semibold">
                  {t("photosHeading")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {articles.map((article) => (
                    <ProductPhotos
                      key={article.postId}
                      title={article.title}
                      photos={article.photos.slice(0, 1)}
                    />
                  ))}
                </div>
              </OutreachStep>

              <OutreachStep
                id="outreach-step-publish"
                heading={t("stepPublishHeading")}
                hint={
                  postChannels.length > 0 ? t("stepPublishHint") : undefined
                }
              >
                {postChannels.length === 0 ? (
                  <p className="text-sm text-text-support">
                    {t("noPostGroups")}{" "}
                    <Link
                      href="/admin/difusion/grupos"
                      className="font-semibold"
                    >
                      {t("groupsLink")}
                    </Link>
                  </p>
                ) : (
                  <MarkPublishedForm
                    outreachTextId={text.id}
                    postId={null}
                    submitLabel={t("markPostPublished")}
                    channels={postChannels.map((status) => ({
                      id: status.channel.id,
                      name: status.channel.name,
                      lastPublished: lastPublishedLabel(
                        t,
                        status.lastPublishedAt,
                        now,
                      ),
                      details: (
                        <ChannelDetails
                          channel={status.channel}
                          turn={status.turn}
                          versionNumber={
                            turnsVersions ? status.version + 1 : undefined
                          }
                        />
                      ),
                    }))}
                  />
                )}
              </OutreachStep>
            </div>
          </>
        ) : (
          <p data-testid="outreach-nothing" className="text-text-support">
            {t("nothingToAnnounce")}
          </p>
        )}
      </section>

      {kit.text ? (
        <ListingArticles
          className={SECTION}
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
    </main>
  );
}
