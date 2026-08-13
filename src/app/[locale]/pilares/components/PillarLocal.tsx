import { getTranslations } from "next-intl/server";
import type { HabitChallengeExperienceKey } from "~/domain/habits/habitChallengeExperiences";
import { readViewerId } from "~/infra/auth/readViewerId";
import LocationBanner from "~/presentation/location/LocationBanner";
import { readPillarLocal } from "../pillarLocalData";
import PillarLocalSection from "./PillarLocalSection";
import { PILLAR_KEY_BY_CHALLENGE } from "./pilaresData";

/**
 * Lo que la sección local necesita del servidor: la categoría del pilar, lo que hay publicado en
 * ella, quién lo vende y dónde está quien mira. Una sola para los cuatro pilares.
 *
 * Mismo reparto que `PillarPractice`: aquí viven las lecturas —base, sesión, catálogo de textos— y
 * la sección de al lado solo pinta. El aviso de ubicación entra como nodo ya montado porque lee la
 * ubicación por su cuenta, igual que el panel del reto entra montado en la práctica.
 *
 * El pilar que se leerá **no llega como parámetro**: sale del reto por `PILLAR_KEY_BY_CHALLENGE`, y
 * así una página no puede pedir la sección de un pilar con el color de otro.
 */
export default async function PillarLocal({
  challenge,
  locale,
}: {
  challenge: HabitChallengeExperienceKey;
  locale: string;
}): Promise<React.ReactNode> {
  const [t, tDirectory, data, viewerId] = await Promise.all([
    getTranslations("pillarLocal"),
    getTranslations("directory"),
    readPillarLocal(challenge, locale),
    readViewerId(),
  ]);

  return (
    <PillarLocalSection
      pillar={PILLAR_KEY_BY_CHALLENGE[challenge]}
      categoryKey={data.categoryKey}
      copy={{
        heading: t("heading"),
        intro: t(`${challenge}.intro`),
        emptyBody: t(`${challenge}.empty`),
        publishLabel: t("publish"),
        seeAllLabel: t("seeAll", { category: data.categoryLabel }),
        storesHeading: t("storesHeading"),
        publicationsLabel: (count: number) =>
          tDirectory("publications", { count }),
        visitLabel: tDirectory("visit"),
      }}
      posts={data.posts}
      stores={data.stores}
      locationBanner={
        <LocationBanner showSellerCta={data.showSellerCta} className="mb-6" />
      }
      viewerId={viewerId}
    />
  );
}
