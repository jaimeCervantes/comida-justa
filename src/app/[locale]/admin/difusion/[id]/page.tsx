import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { enterOutreachAdmin, outreachMetadata } from "../adminGate";
import { loadOutreachText } from "./loadOutreachText";
import CopyText from "./ui/CopyText";
import ExcludedProducts from "./ui/ExcludedProducts";
import ListingArticles from "./ui/ListingArticles";
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
  const { text, kit, articles } = await loadOutreachText(id, locale);

  return (
    <main>
      <Link
        href="/admin/difusion"
        className="text-sm text-text-support hover:text-highlight"
      >
        {t("backToList")}
      </Link>

      <div className="mt-2 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{text.name}</h1>
        <Link
          href={{ pathname: "/admin/difusion/[id]/editar", params: { id } }}
          className="font-semibold hover:text-highlight"
        >
          {t("edit")}
        </Link>
      </div>

      <section data-testid="outreach-group-post">
        <h2 className="text-lg font-semibold mb-1">{t("groupPostHeading")}</h2>

        {kit.text ? (
          <>
            <p className="mb-3 text-sm text-text-support">
              {t("groupPostHint")}
            </p>
            {/* `pre-wrap` y no `pre`: conserva los renglones tal cual se pegarán, sin obligar a
                desplazarse de lado en un teléfono. */}
            <pre
              data-testid="outreach-text"
              className="mb-3 whitespace-pre-wrap break-words rounded-card border border-separator bg-surface-elevation-1 p-4 font-sans"
            >
              {kit.text}
            </pre>
            <CopyText text={kit.text} label={t("copy")} />

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
          </>
        ) : (
          <p data-testid="outreach-nothing" className="text-text-support">
            {t("nothingToAnnounce")}
          </p>
        )}
      </section>

      {kit.text ? (
        <ListingArticles articles={articles} description={kit.text} />
      ) : null}

      <ExcludedProducts excluded={kit.excluded} />
    </main>
  );
}
