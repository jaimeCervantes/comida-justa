"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { CHALLENGE_KEY_BY_PILLAR } from "~/app/[locale]/pilares/components/pilaresData";
import { PRACTICE_POST_KIND } from "~/domain/entities/post/kind";
import { parsePostMediaPayload } from "~/domain/entities/post/mediaPayload";
import PostEntity from "~/domain/entities/post/Post";
import type { User } from "~/domain/entities/post/types";
import {
  COMMUNITY_TIMEZONE,
  localDateAt,
} from "~/domain/habits/habitChallenge";
import { HABIT_CHALLENGE_EXPERIENCES } from "~/domain/habits/habitChallengeExperiences";
import type { PillarKey } from "~/domain/pillars/pillarKey";
import { activeKeys } from "~/domain/practices/adoption";
import { primaryPillarOf } from "~/domain/practices/practiceCard";
import { practiceDaySlug } from "~/domain/practices/practiceDayPost";
import {
  categoryKeyForPracticePillar,
  practiceEvidenceSlug,
} from "~/domain/practices/practicePost";
import PostValidator from "~/domain/schemas/PostValidator";
import getErrorMessage from "~/domain/shared/getErrorMessage";
import { revalidateLocalizedPath } from "~/i18n/revalidateLocalizedPath";
import { resolveLocale } from "~/i18n/routing";
import { auth } from "~/infra/auth";
import { readViewerId } from "~/infra/auth/readViewerId";
import { createPostRepository } from "~/infra/dataAccess/createOnePost/factory";
import { createHabitChallengeRepository } from "~/infra/dataAccess/habits/PostgresHabitChallengeRepository";
import { PostgresPracticeAdoption } from "~/infra/dataAccess/practices/PostgresPracticeAdoption";
import { PostgresPracticeCatalog } from "~/infra/dataAccess/practices/PostgresPracticeCatalog";
import type { ActionState } from "~/infra/types/Actions";
import CreateOnePostUseCase from "~/use_cases/createOnePost/createOnePostUseCase";
import HabitChallengeUseCase from "~/use_cases/habits/habitChallengeUseCase";
import PracticeAdoptionUseCase from "~/use_cases/practices/practiceAdoptionUseCase";
import PracticeCatalogUseCase from "~/use_cases/practices/practiceCatalogUseCase";
import { publishPracticeDayPost } from "./publishPracticeDayPost";

type PracticeEvidenceActionState = ActionState & {
  message?: string | null;
};

const createPracticePost = new CreateOnePostUseCase(
  new PostValidator(),
  new PostEntity(),
  createPostRepository(),
);

/**
 * Empezar o dejar una práctica del catálogo.
 *
 * **Sin sesión no hace nada y no explota.** Ocultar el botón es cortesía; quien decide es el
 * servidor, que resuelve la identidad de la sesión y nunca del formulario — la misma regla que
 * siguen el reto atómico y la tabla del jardín.
 *
 * La clave viaja en el formulario, pero el repositorio sólo la acepta si existe y está publicada,
 * así que mandarla a mano no inscribe a nadie en nada.
 */
export async function manageOwnPractice(formData: FormData): Promise<void> {
  const userId = await readViewerId();
  if (!userId) return;

  const practiceKey = formData.get("practiceKey");
  if (typeof practiceKey !== "string" || practiceKey === "") return;

  const useCase = new PracticeAdoptionUseCase(new PostgresPracticeAdoption());
  if (formData.get("intent") === "stop") {
    await useCase.stop(userId, practiceKey);
  } else {
    await useCase.start(userId, practiceKey, "web");
  }

  revalidateLocalizedPath("/practicas");
  revalidateLocalizedPath("/habitos");
}

export async function setPracticeSharing(formData: FormData): Promise<void> {
  const userId = await readViewerId();
  if (!userId) return;

  const practiceKey = formData.get("practiceKey");
  if (typeof practiceKey !== "string" || practiceKey === "") return;

  const intent = formData.get("intent");
  if (intent !== "share" && intent !== "withdraw") return;

  await new PracticeAdoptionUseCase(new PostgresPracticeAdoption()).setSharing(
    userId,
    practiceKey,
    intent === "share",
  );

  revalidateLocalizedPath("/habitos");
}

async function recordPracticeForPillar(
  userId: string,
  pillar: PillarKey,
): Promise<void> {
  const { challengeKey } =
    HABIT_CHALLENGE_EXPERIENCES[CHALLENGE_KEY_BY_PILLAR[pillar]];
  const useCase = new HabitChallengeUseCase(
    createHabitChallengeRepository(challengeKey),
  );

  await useCase.start(userId, COMMUNITY_TIMEZONE);
  await useCase.recordPracticeDay(
    userId,
    localDateAt(new Date(), COMMUNITY_TIMEZONE),
  );
}

/**
 * Marcar que hoy se practicó.
 *
 * **La unidad de conteo es el pilar y el día, no la práctica.** Marcar *Penumbra total* es haber
 * practicado el descanso, así que la repetición se escribe en `habit_repetitions` con el reto del
 * pilar, y su índice único por persona, reto y fecha hace el resto: marcar doce prácticas un martes
 * sigue siendo un día. Sin esa regla, la tabla del jardín premiaría a quien marca más casillas.
 *
 * El pilar se resuelve **contra la base** y no contra el formulario: quien manda la clave no decide
 * a qué pilar apunta su repetición.
 */
export async function markPracticeDone(formData: FormData): Promise<void> {
  const userId = await readViewerId();
  if (!userId) return;

  const practiceKey = formData.get("practiceKey");
  if (typeof practiceKey !== "string" || practiceKey === "") return;

  const pillar = await new PracticeCatalogUseCase(
    new PostgresPracticeCatalog(),
  ).primaryPillarOf(practiceKey);
  if (!pillar) return;

  await recordPracticeForPillar(userId, pillar);
  await publishMarkedPractice(userId, practiceKey, pillar);

  revalidateLocalizedPath("/");
  revalidateLocalizedPath("/practicas");
  revalidateLocalizedPath("/habitos");
}

/**
 * Marcar una práctica también publica, igual que marcar el día del ritual.
 *
 * **La unidad de publicación es la práctica y el día, no el pilar y el día.** Esa es la diferencia
 * con `habit_repetitions`: hacer *Penumbra total* y *La descarga mental* el mismo martes cuenta como
 * un día de descanso para el jardín, pero son dos acciones distintas y merecen dos publicaciones.
 * `practiceDaySlug` lleva la clave de la práctica, así que la segunda no choca con la primera.
 *
 * Publicar evidencia no pasa por aquí: tiene su propia publicación con foto, y engancharla al mismo
 * sitio que `recordPracticeForPillar` —que ambos caminos comparten— daría dos posts por una práctica.
 */
async function publishMarkedPractice(
  userId: string,
  practiceKey: string,
  pillar: PillarKey,
): Promise<void> {
  const locale = resolveLocale(await getLocale());
  const t = await getTranslations({ locale, namespace: "practicesIndex" });
  const practice = (
    await new PracticeCatalogUseCase(new PostgresPracticeCatalog()).listAdopted(
      locale,
      new Set([practiceKey]),
    )
  ).find(({ key }) => key === practiceKey);
  if (!practice) return;

  await publishPracticeDayPost({
    slug: practiceDaySlug({
      practiceKey,
      cycleDate: localDateAt(new Date(), COMMUNITY_TIMEZONE),
      userId,
    }),
    title: t("evidencePostTitle", { practice: practice.title }),
    content: t("evidencePostContent", {
      summary: practice.summary,
      minimum: practice.minimum ?? t("evidencePostMinimumWhole"),
    }),
    category: categoryKeyForPracticePillar(pillar),
    userId,
    locale,
  });
}

/**
 * Convierte una práctica hecha en una publicación social con evidencia.
 *
 * La práctica no se elige desde un formulario genérico: llega como `practiceKey` desde el tablero,
 * se valida contra las prácticas activas de la persona y de ahí salen pilar, categoría, título y
 * descripción. Eso mantiene baja la fricción sin permitir que el navegador invente a qué pilar
 * pertenece lo publicado.
 */
export async function publishPracticeEvidence(
  _prevState: PracticeEvidenceActionState,
  formData: FormData,
): Promise<PracticeEvidenceActionState> {
  const t = await getTranslations("practicesIndex");
  const session = await auth();
  const user = session?.user as User | undefined;

  if (!user?.id) {
    return {
      errors: { errorMessage: t("evidenceSignIn") },
      success: false,
      id: null,
      slug: null,
      message: null,
    };
  }

  const practiceKey = formData.get("practiceKey");
  if (typeof practiceKey !== "string" || practiceKey === "") {
    return {
      errors: { errorMessage: t("evidencePracticeMissing") },
      success: false,
      id: null,
      slug: null,
      message: null,
    };
  }

  const media = parsePostMediaPayload(formData.get("media") as string | null);
  if (media.length === 0) {
    return {
      errors: { media: t("evidenceMediaRequired") },
      success: false,
      id: null,
      slug: null,
      message: null,
    };
  }

  const locale = await getLocale();
  const adoptionUseCase = new PracticeAdoptionUseCase(
    new PostgresPracticeAdoption(),
  );
  const adopted = activeKeys(await adoptionUseCase.listFor(user.id));

  if (!adopted.has(practiceKey)) {
    return {
      errors: { errorMessage: t("evidencePracticeMissing") },
      success: false,
      id: null,
      slug: null,
      message: null,
    };
  }

  const practice = (
    await new PracticeCatalogUseCase(new PostgresPracticeCatalog()).listAdopted(
      locale,
      adopted,
    )
  ).find(({ key }) => key === practiceKey);

  if (!practice) {
    return {
      errors: { errorMessage: t("evidencePracticeMissing") },
      success: false,
      id: null,
      slug: null,
      message: null,
    };
  }

  const pillar = primaryPillarOf(practice);
  const title = t("evidencePostTitle", { practice: practice.title });
  const minimum = practice.minimum ?? t("evidencePostMinimumWhole");
  const note = String(formData.get("note") ?? "").trim();
  const content = [
    t("evidencePostContent", {
      summary: practice.summary,
      minimum,
    }),
    note,
  ]
    .filter(Boolean)
    .join("\n\n");
  const mediaWithAlt = parsePostMediaPayload(formData.get("media") as string, {
    alt: title,
  });
  const now = new Date();

  const result = await createPracticePost.execute(
    {
      title,
      slug: practiceEvidenceSlug(practice.key, now),
      content,
      contactInfo: { phone: "" },
      price: null,
      kind: PRACTICE_POST_KIND,
      origin: null,
      category: categoryKeyForPracticePillar(pillar),
      subCategory: null,
      sellerId: null,
      startsAt: null,
      endsAt: null,
      durationMinutes: null,
      createdAt: now,
      media: mediaWithAlt,
      user,
    },
    locale,
  );

  if (result.error || !result.id || !result.slug) {
    return {
      errors: {
        errorMessage:
          process.env.NODE_ENV === "development"
            ? getErrorMessage(result.error, t("evidenceUnexpected"))
            : t("evidenceUnexpected"),
      },
      success: false,
      id: null,
      slug: null,
      message: null,
    };
  }

  await recordPracticeForPillar(user.id, pillar);

  revalidateLocalizedPath("/");
  revalidateLocalizedPath("/practicas");
  revalidateLocalizedPath("/habitos");

  return {
    errors: {},
    success: true,
    id: result.id,
    slug: result.slug,
    message: t("evidencePublished"),
  };
}
