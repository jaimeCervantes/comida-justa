import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { pillarHref } from "~/i18n/routes";
import Avatar from "~/presentation/user/Avatar/Avatar";
import type { PublicHabitCelebration } from "~/use_cases/habits/ports/HabitChallengeRepository";
import type { CommunitySectionVariant } from "./communitySectionVariant";
import { getHabitPublicTheme } from "./habitPublicThemes";

/**
 * La tarjeta dice lo mismo en las dos variantes —quién, qué logró y a dónde ir—; lo único que
 * cambia es cuánto sitio se toma para decirlo. Las medidas viven juntas aquí y no repartidas por el
 * JSX para poder comparar de un vistazo las dos escalas.
 *
 * `compact` además pone el avatar **encima** del texto en vez de a su lado: dos tarjetas por fila
 * dejan unos 200 px de ancho, y ahí una columna de avatar se come el renglón. Apilarlo es lo que
 * hace que la tarjeta salga cuadrada en lugar de un rectángulo estirado.
 */
const SCALES = {
  full: {
    article: "rounded-panel p-6 sm:p-8",
    symbol: "-right-8 -top-10 text-[9rem]",
    header: "items-start gap-4",
    avatarRing: "p-1 ring-4",
    avatarSize: "md",
    content: "min-w-0",
    eyebrow: "mb-1 text-xs tracking-[0.18em]",
    title: "text-xl sm:text-2xl",
    body: "mt-2 text-body",
    link: "mt-4",
    actions: "mt-4 gap-3",
    button: "px-4 py-2 text-sm",
    count: "text-sm",
  },
  compact: {
    article: "rounded-card p-4",
    symbol: "-right-5 -top-6 text-[5rem]",
    header: "flex-col items-start gap-2",
    avatarRing: "p-0.5 ring-2",
    avatarSize: "sm",
    /* En columna, `items-start` encoge a los hijos al ancho de su contenido: sin `w-full` el texto
       se estrecharía en vez de ocupar la tarjeta. */
    content: "w-full min-w-0",
    eyebrow: "mb-1 text-[0.7rem] tracking-[0.12em]",
    title: "text-base",
    body: "mt-1 text-sm text-body",
    link: "mt-2 text-sm",
    actions: "mt-3 flex-wrap gap-2",
    button: "px-3 py-1 text-xs",
    count: "text-xs",
  },
} as const satisfies Record<CommunitySectionVariant, Record<string, string>>;

export default async function PublicHabitCelebrationCard({
  celebration,
  headingLevel = 2,
  viewerSignedIn = false,
  reactionAction,
  signInHref,
  variant = "full",
}: {
  celebration: PublicHabitCelebration;
  headingLevel?: 2 | 3;
  viewerSignedIn?: boolean;
  /** La puerta de entrar, con la vuelta a la página que enseña la lista escrita dentro. */
  signInHref: string;
  reactionAction?: (formData: FormData) => Promise<void>;
  variant?: CommunitySectionVariant;
}): Promise<React.ReactNode> {
  const scale = SCALES[variant];
  const t = await getTranslations("atomicSleepChallenge");
  const habitT = await getTranslations("atomicChallenges");
  const nutrition = celebration.challengeKey === "nutrition-one-plant-v1";
  const movement = celebration.challengeKey === "movement-two-minutes-v1";
  const mind = celebration.challengeKey === "mind-one-connection-v1";
  const name =
    celebration.displayName ??
    (nutrition || movement || mind
      ? habitT("experienceCommon.communityAnonymous")
      : t("communityAnonymous"));
  const final = celebration.milestone === "challenge_completed";
  const copy = nutrition
    ? {
        eyebrow: habitT("nutritionExperience.publicCardEyebrow"),
        title: final
          ? habitT("nutritionExperience.publicFinalCardTitle", { name })
          : habitT("nutritionExperience.publicCardTitle", { name }),
        body: final
          ? habitT("nutritionExperience.publicFinalCardBody")
          : habitT("nutritionExperience.publicCardBody"),
        link: habitT("nutritionExperience.publicLink"),
        href: pillarHref("alimentacion"),
      }
    : movement
      ? {
          eyebrow: habitT("movementExperience.publicCardEyebrow"),
          title: final
            ? habitT("movementExperience.publicFinalCardTitle", { name })
            : habitT("movementExperience.publicCardTitle", { name }),
          body: final
            ? habitT("movementExperience.publicFinalCardBody")
            : habitT("movementExperience.publicCardBody"),
          link: habitT("movementExperience.publicLink"),
          href: pillarHref("movimiento"),
        }
      : mind
        ? {
            eyebrow: habitT("mindExperience.publicCardEyebrow"),
            title: final
              ? habitT("mindExperience.publicFinalCardTitle", { name })
              : habitT("mindExperience.publicCardTitle", { name }),
            body: final
              ? habitT("mindExperience.publicFinalCardBody")
              : habitT("mindExperience.publicCardBody"),
            link: habitT("mindExperience.publicLink"),
            href: pillarHref("mente-espiritu"),
          }
        : {
            eyebrow: t("communityCardEyebrow"),
            title: final
              ? t("communityFinalCardTitle", { name })
              : t("communityCardTitle", { name }),
            body: final ? t("communityFinalCardBody") : t("communityCardBody"),
            link: t("communityLink"),
            href: pillarHref("sueno"),
          };
  const theme = getHabitPublicTheme(
    nutrition ? "nutrition" : movement ? "movement" : mind ? "mind" : "sleep",
  );
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <article
      data-testid="public-habit-celebration"
      data-pillar={theme.pillar}
      className={`relative h-full overflow-hidden border shadow-sm ${scale.article} ${theme.article}`}
    >
      <div
        aria-hidden="true"
        className={`absolute leading-none opacity-10 ${scale.symbol}`}
      >
        {theme.symbol}
      </div>
      <div className={`relative flex ${scale.header}`}>
        <div className={`rounded-full ${scale.avatarRing} ${theme.soft}`}>
          <Avatar
            user={{ name, image: celebration.image }}
            size={scale.avatarSize}
          />
        </div>
        <div className={scale.content}>
          <p className={`font-bold uppercase ${scale.eyebrow} ${theme.ink}`}>
            {copy.eyebrow}
          </p>
          <Heading className={`font-extrabold text-text-strong ${scale.title}`}>
            {copy.title}
          </Heading>
          {variant === "full" && <p className={scale.body}>{copy.body}</p>}
          <Link
            href={copy.href}
            className={`focus-ring inline-flex rounded-chip font-semibold underline underline-offset-4 ${scale.link} ${theme.ink}`}
          >
            {copy.link} →
          </Link>
          <div className={`flex items-center ${scale.actions}`}>
            {viewerSignedIn && reactionAction ? (
              <form action={reactionAction}>
                <input
                  type="hidden"
                  name="celebrationId"
                  value={celebration.id}
                />
                <input
                  type="hidden"
                  name="intent"
                  value={celebration.viewerReacted ? "withdraw" : "celebrate"}
                />
                <button
                  type="submit"
                  className={`focus-ring rounded-full border bg-surface-elevation-1 font-bold ${scale.button} ${theme.border} ${theme.ink}`}
                >
                  {celebration.viewerReacted
                    ? habitT("experienceCommon.reactionWithdraw")
                    : habitT("experienceCommon.reactionCelebrate")}
                </button>
              </form>
            ) : (
              /* La vuelta es a esta misma lista, no a la portada: quien celebra a alguien está
                 leyendo la lista, y devolverlo al inicio le hace buscar otra vez la tarjeta. */
              <a
                href={signInHref}
                className={`focus-ring rounded-full font-semibold underline ${theme.ink}`}
              >
                {habitT("experienceCommon.reactionSignIn")}
              </a>
            )}
            <span className={`text-body ${scale.count}`}>
              {habitT("experienceCommon.reactionCount", {
                count: celebration.reactionCount,
              })}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
