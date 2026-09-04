import { useTranslations } from "next-intl";
import type {
  AccountSetup,
  AccountSetupStepKey,
} from "~/domain/entities/seller/accountSetup";
import { type AppHref, Link } from "~/i18n/navigation";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { ChecklistProgress } from "~/presentation/design_system/feedback/ChecklistProgress";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { ANCHOR } from "../anchors";
import AccountCard from "./AccountCard";

/**
 * Las claves del catálogo, escritas una a una.
 *
 * Podrían componerse (`t(\`setupStep${key}\`)`) porque `AccountSetupStepKey` es una unión cerrada,
 * pero entonces ninguna de las diez claves aparecería al buscarla en el proyecto, y una clave que no
 * se encuentra con `grep` es una clave que alguien borra el día que limpia el catálogo.
 */
const STEP_MESSAGES: Record<
  AccountSetupStepKey,
  { label: MessageKey; hint: MessageKey }
> = {
  store: { label: "setupStepStore", hint: "setupStepStoreHint" },
  username: { label: "setupStepUsername", hint: "setupStepUsernameHint" },
  logo: { label: "setupStepLogo", hint: "setupStepLogoHint" },
  description: {
    label: "setupStepDescription",
    hint: "setupStepDescriptionHint",
  },
  branchLocation: {
    label: "setupStepBranchLocation",
    hint: "setupStepBranchLocationHint",
  },
};

type MessageKey =
  | "setupStepStore"
  | "setupStepStoreHint"
  | "setupStepUsername"
  | "setupStepUsernameHint"
  | "setupStepLogo"
  | "setupStepLogoHint"
  | "setupStepDescription"
  | "setupStepDescriptionHint"
  | "setupStepBranchLocation"
  | "setupStepBranchLocationHint";

/**
 * A dónde lleva cada pendiente.
 *
 * Los cinco caen en `/cuenta` porque los cinco se resuelven en esta misma página: el enlace lleva al
 * **ancla** del bloque que lo arregla, que es lo que convierte una lista de reproches en una lista
 * de atajos. Cuando el bloque se mude a otra pantalla —el alta de sucursal lo hará en el slice 2—
 * cambia aquí y en ningún otro sitio.
 */
const STEP_TARGET: Record<AccountSetupStepKey, AppHref> = {
  store: { pathname: "/cuenta", hash: ANCHOR.store },
  username: { pathname: "/cuenta", hash: ANCHOR.username },
  logo: { pathname: "/cuenta", hash: ANCHOR.storeProfile },
  description: { pathname: "/cuenta", hash: ANCHOR.storeProfile },
  branchLocation: { pathname: "/cuenta", hash: ANCHOR.addBranch },
};

/**
 * Lo que le falta a la cuenta para que sus clientes la encuentren.
 *
 * **No se pinta cuando no falta nada.** Una lista de cinco marcas verdes permanente es ruido con
 * forma de logro: ocupa el sitio más valioso de la pantalla para no pedir nada. Es la decisión que
 * ya tomó el sitio con los estados vacíos —un vacío dice qué hacer ahora, y aquí no hay nada que
 * hacer—, así que quien la llama recibe `null` y la página se cierra sola.
 *
 * **La regla de qué falta no vive aquí.** `readAccountSetup` es una función pura del dominio; este
 * componente solo le pone nombre traducido y destino a cada paso. Así el «0,0 no cuenta como
 * ubicación» se comprueba en una prueba de milisegundos y no montando una página.
 */
export default function SetupChecklist({ setup }: { setup: AccountSetup }) {
  const t = useTranslations("account");

  if (setup.complete) return null;

  return (
    <AccountCard
      title={t("setupHeading")}
      intro={t("setupIntro")}
      testId="account-setup"
    >
      <ChecklistProgress
        testId="setup-checklist"
        summary={t("setupSummary", { done: setup.done, total: setup.total })}
        statusLabels={{ done: t("setupDone"), pending: t("setupPending") }}
        items={setup.steps.map((step) => {
          const messages = STEP_MESSAGES[step.key];

          return {
            id: step.key,
            done: step.done,
            label: t(messages.label),
            hint: t(messages.hint),
            /* La forma con objeto y no una cadena con `#`: `Link` traduce el camino al idioma
               activo y le pega el fragmento, así que en inglés lleva a `/en/cuenta#…` sin que este
               archivo sepa nada de idiomas. */
            action: (
              <Link
                href={STEP_TARGET[step.key]}
                /* Perfilado y no relleno: son hasta cinco a la vez, y cinco botones sólidos en
                   columna pesan más que el «Guardar ficha» que sí es la acción principal de la
                   pantalla. `white` toma el mismo fondo que la tarjeta, así que con el borde del
                   sistema queda un botón de contorno sin inventar una variante nueva. */
                className={cn(
                  buttonVariants({ size: "sm", color: "white" }),
                  "border border-separator",
                )}
              >
                {t("setupGo")}
              </Link>
            ),
          };
        })}
      />
    </AccountCard>
  );
}
