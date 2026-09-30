"use client";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { MdClose, MdPlayArrow } from "react-icons/md";
import { getPathname, usePathname } from "~/i18n/navigation";
import { PILLARS_OVERVIEW_HREF } from "~/i18n/routes";
import { resolveLocale } from "~/i18n/routing";
import { useIsClient } from "~/infra/UI/hooks/useIsClient";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { PILLARS_OVERVIEW_PRACTICES_ANCHOR } from "~/presentation/habits/pillarPageAnchors";
import { trackAnimation } from "./animationAnalytics";
import { INVITE_DELAY_MS, invitesOn, PILLARS_INVITE_ID } from "./inviteRoutes";
import styles from "./PillarAnimation.module.css";
import PillarsAnimationDialog from "./PillarsAnimationDialog";
import { markAnimationSeen } from "./seenAnimations";
import { useHasSeenAnimation } from "./usePlaybackPreferences";

const ANIMATION_ID = "pillars-overview";

type Phase = "waiting" | "shown" | "watching" | "closed";

/**
 * La invitación de la primera visita: una tarjeta discreta, en una esquina, que ofrece ver en minuto
 * y medio qué son los cuatro pilares.
 *
 * **Una sola vez por navegador**, y solo a quien no ha visto la animación: se recuerda en cuanto
 * aparece, se acepte o no. No roba el foco ni tapa la página, espera unos segundos a que la página
 * se haya visto, y no aparece donde interrumpiría (comprar, pagar, publicar; ver `inviteRoutes.ts`)
 * ni en `/pilares`, que ya tiene la animación. Aceptarla la reproduce encima, sin salir de la página.
 */
export default function PillarsInvite() {
  const t = useTranslations("pillarAnimations.invite");
  const locale = resolveLocale(useLocale());
  const pathname = usePathname();
  const params = useParams<{ slug?: string[] }>();
  const alreadyWatched = useHasSeenAnimation(ANIMATION_ID);
  const alreadyInvited = useHasSeenAnimation(PILLARS_INVITE_ID);
  const eligible = invitesOn(pathname, params?.slug);
  const [phase, setPhase] = useState<Phase>("waiting");
  const isClient = useIsClient();

  useEffect(() => {
    if (phase !== "waiting" || alreadyWatched || alreadyInvited || !eligible) {
      return;
    }
    const timer = window.setTimeout(() => {
      setPhase("shown");
      markAnimationSeen(PILLARS_INVITE_ID);
      trackAnimation(ANIMATION_ID, "animation_invite_shown", "invite");
    }, INVITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [phase, alreadyWatched, alreadyInvited, eligible]);

  const close = useCallback(() => setPhase("closed"), []);

  /* Solo existe en el cliente, ya hidratado: dice que el temporizador de la invitación está armado,
     o que en esta página no toca. Las pruebas lo esperan antes de adelantar el reloj; sin él, un
     «no aparece» podría pasar solo porque la página todavía no había hidratado. */
  const probe = isClient ? (
    <span
      hidden
      data-testid="pillars-invite-probe"
      data-phase={phase}
      data-eligible={eligible}
    />
  ) : null;

  if (phase === "watching") {
    return (
      <>
        {probe}
        <PillarsAnimationDialog
          label={t("dialogLabel")}
          closeLabel={t("close")}
          practicesHref={`${getPathname({ locale, href: PILLARS_OVERVIEW_HREF })}#${PILLARS_OVERVIEW_PRACTICES_ANCHOR}`}
          onClose={close}
        />
      </>
    );
  }

  if (phase !== "shown" || !eligible || alreadyWatched) return probe;

  const accept = () => {
    trackAnimation(ANIMATION_ID, "animation_invite_accept", "invite");
    setPhase("watching");
  };
  const dismiss = () => {
    trackAnimation(ANIMATION_ID, "animation_invite_dismiss", "invite");
    setPhase("closed");
  };

  return (
    <>
      {probe}
      <section
        aria-label={t("label")}
        data-testid="pillars-invite"
        className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md lg:inset-x-auto lg:right-6 lg:bottom-6 lg:mx-0 lg:w-[24rem]"
      >
        <div
          className={`${styles.inviteEnter} relative flex gap-3 overflow-hidden rounded-card border border-border bg-surface-elevation-1 p-3 pr-9 shadow-2xl`}
        >
          {/* La miniatura también abre la animación, pero es un atajo de ratón: el botón «Ver ahora»
            es el control accesible, así que esta no entra en el orden de tabulación. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={accept}
            className="relative h-20 w-28 shrink-0 overflow-hidden rounded-control"
          >
            {/* biome-ignore lint/performance/noImgElement: miniatura decorativa de 112 px servida tal cual; la optimización de Next está apagada en este proyecto. */}
            <img
              src="/animations/pilares/intro-1-960.webp"
              alt=""
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/25">
              <span className="flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-lg">
                <MdPlayArrow className="size-6" />
              </span>
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-text-base">
              {t("title")}
            </p>
            <p className="mt-1 text-xs leading-snug text-text-muted">
              {t("body")}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="pillars-invite-watch"
                onClick={accept}
                className={buttonVariants({ color: "green", size: "sm" })}
              >
                <MdPlayArrow aria-hidden className="mr-1 size-5 shrink-0" />
                {t("watch")}
              </button>
              <button
                type="button"
                data-testid="pillars-invite-later"
                onClick={dismiss}
                className={buttonVariants({ color: "white", size: "sm" })}
              >
                {t("later")}
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={dismiss}
            className="focus-ring absolute top-2 right-2 rounded-full p-1 text-text-muted hover:bg-surface-elevation-2 hover:text-text-base"
          >
            <MdClose aria-hidden className="size-5" />
          </button>
        </div>
      </section>
    </>
  );
}
