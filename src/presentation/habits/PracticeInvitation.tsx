import { getTranslations } from "next-intl/server";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { Heading } from "~/presentation/design_system/typography/Heading";

/**
 * El cierre de la portada de pilares: «Tu turno».
 *
 * Sus cuatro textos llevaban escritos en el catálogo (`habitCommunity.invitation`) desde antes de
 * este componente, **sin que los pintara nadie**. Copia muerta: traducida a dos idiomas, revisada
 * en cada barrido de i18n y sin llegar nunca a una pantalla.
 *
 * El destino entra por prop porque la invitación no sabe dónde se elige una práctica: en `/pilares`
 * son las tarjetas de la propia página, y el día que esto se reutilice en otra portada será otro
 * sitio. Es un `<a>` y no un botón: un CTA que navega se abre en pestaña nueva y se copia su
 * dirección, que es justo lo que `buttonVariants` existe para permitir sin escribir el relleno a
 * mano.
 */
export default async function PracticeInvitation({
  ctaHref,
}: {
  ctaHref: string;
}): Promise<React.ReactNode> {
  const t = await getTranslations("habitCommunity.invitation");

  return (
    <section
      data-testid="practice-invitation"
      className="rounded-panel border border-separator bg-surface-elevation-2 p-6 text-center sm:p-10"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-pw-green">
        {t("eyebrow")}
      </p>
      <Heading level={2} tone="inherit" className="mt-2 text-text-strong">
        {t("title")}
      </Heading>
      <p className="mx-auto mt-3 max-w-2xl text-body">{t("body")}</p>
      <a
        href={ctaHref}
        className={`mt-6 ${buttonVariants({ color: "green", size: "lg" })}`}
      >
        {t("cta")}
      </a>
    </section>
  );
}
