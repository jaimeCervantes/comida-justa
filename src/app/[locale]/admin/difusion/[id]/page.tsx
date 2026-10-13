import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { enterOutreachAdmin, outreachMetadata } from "../adminGate";
import { loadOutreachText } from "./loadOutreachText";
import CopyOutreachText from "./ui/CopyOutreachText";
import ExcludedProducts from "./ui/ExcludedProducts";

export const generateMetadata = outreachMetadata;

/**
 * El kit de una publicación: el texto listo para pegar en un grupo normal.
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
  const { text, kit } = await loadOutreachText(id, locale);

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

      <section>
        <h2 className="text-lg font-semibold mb-2">{t("textHeading")}</h2>

        {kit.text ? (
          <>
            {/* `pre-wrap` y no `pre`: conserva los renglones tal cual se pegarán, sin obligar a
                desplazarse de lado en un teléfono. */}
            <pre
              data-testid="outreach-text"
              className="mb-3 whitespace-pre-wrap break-words rounded-card border border-separator bg-surface-elevation-1 p-4 font-sans"
            >
              {kit.text}
            </pre>
            <CopyOutreachText text={kit.text} />
          </>
        ) : (
          <p data-testid="outreach-nothing" className="text-text-support">
            {t("nothingToAnnounce")}
          </p>
        )}
      </section>

      <ExcludedProducts excluded={kit.excluded} />
    </main>
  );
}
