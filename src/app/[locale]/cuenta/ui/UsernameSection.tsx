"use client";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { MdAlternateEmail } from "react-icons/md";
import { generateUsername } from "~/domain/entities/user/username";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import type { ClaimUsernameState } from "../actions";
import { profilePath } from "../profilePath";
import AccountCard from "./AccountCard";

/**
 * Donde se reserva la dirección personal.
 *
 * **Ya no tiene la rama de «ya reservada», y no fue por gusto.** Tenía una: al volver el estado con
 * la dirección recién reservada, pintaba una tarjeta con el enlace y su botón de repartir. Nunca
 * llega a verse. `claimUsername` revalida `/cuenta`, la página vuelve con la dirección puesta y la
 * cabecera de identidad —que es la dueña de las direcciones públicas desde el slice 1 de
 * `005-2026-09-04-cuenta-configurable`— la enseña ahí arriba; esta sección deja de montarse entera.
 * Es exactamente lo que ya le pasó a `StoreReadyMessage` en `BecomeSellerForm`, y se comprobó igual:
 * los seis escenarios que buscaban la tarjeta `username-card` la esperaron cinco segundos y no
 * apareció.
 *
 * Así que quien llama solo la monta **mientras no haya dirección**, y este componente es una cosa
 * sola: el formulario.
 */
export default function UsernameSection({
  id,
  action,
  defaultName,
}: {
  /** El ancla del bloque, de `anchors.ts`. */
  id?: string;
  action: (
    state: ClaimUsernameState,
    data: FormData,
  ) => Promise<ClaimUsernameState>;
  defaultName?: string | null;
}) {
  const t = useTranslations("account");
  const locale = resolveLocale(useLocale());
  const [state, claimAction, isPending] = useActionState<
    ClaimUsernameState,
    FormData
  >(action, {});
  const [requested, setRequested] = useState<string>(defaultName ?? "");

  // Se calcula con la MISMA función del dominio que corre en el servidor: lo que se lee aquí
  // es lo que va a quedar guardado.
  const preview = generateUsername(requested);

  return (
    <AccountCard id={id} title={t("usernameTitle")} intro={t("usernameIntro")}>
      {state.errorMessage ? (
        <p data-testid="username-error" className="mb-4 text-brand-clay-700">
          {state.errorMessage}
        </p>
      ) : null}

      <ValidatedForm action={claimAction} aria-label={t("usernameFormLabel")}>
        <TextField
          required
          name="username"
          type="text"
          autoComplete="username"
          label={t("username")}
          placeholder={t("usernamePlaceholder")}
          icon={<MdAlternateEmail />}
          value={requested}
          onChange={(event) => setRequested(event.target.value)}
          containerClassName="mb-2"
        />

        <p className="mb-6 text-sm text-text-support">
          {t.rich("profilePreview", {
            address: `${PUBLIC_BASE_URL}${profilePath(preview || "…", locale)}`,
            url: (chunks) => (
              <span data-testid="username-preview" className="font-bold">
                {chunks}
              </span>
            ),
          })}
        </p>

        <Button
          type="submit"
          color="green"
          isLoading={isPending}
          disabled={isPending}
        >
          {t("usernameSubmit")}
        </Button>
      </ValidatedForm>
    </AccountCard>
  );
}
