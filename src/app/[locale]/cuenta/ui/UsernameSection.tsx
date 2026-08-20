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
import { profileHref, profilePath } from "../profilePath";
import AccountCard from "./AccountCard";
import PublicAddressRow from "./PublicAddressRow";

export default function UsernameSection({
  action,
  currentUsername,
  defaultName,
}: {
  action: (
    state: ClaimUsernameState,
    data: FormData,
  ) => Promise<ClaimUsernameState>;
  /** Si ya la reclamó, se muestra en vez del formulario. */
  currentUsername: string | null;
  defaultName?: string | null;
}) {
  const t = useTranslations("account");
  const locale = resolveLocale(useLocale());
  const [state, claimAction, isPending] = useActionState<
    ClaimUsernameState,
    FormData
  >(action, {});
  const [requested, setRequested] = useState<string>(defaultName ?? "");

  const username = currentUsername ?? state.username;

  if (username) {
    // Quien la reservó ya la tiene: lo siguiente que necesita es repartirla.
    const profileUrl = `${PUBLIC_BASE_URL}${profilePath(username, locale)}`;
    const shareName = defaultName || `@${username}`;

    return (
      <AccountCard title={t("usernameTitle")} testId="username-card">
        <PublicAddressRow
          href={profileHref(username)}
          path={profilePath(username, locale)}
          shareUrl={profileUrl}
          shareTitle={shareName}
          shareText={t("shareProfileText", { name: shareName })}
          shareTestId="share-profile"
        />
      </AccountCard>
    );
  }

  // Se calcula con la MISMA función del dominio que corre en el servidor: lo que se lee aquí
  // es lo que va a quedar guardado.
  const preview = generateUsername(requested);

  return (
    <AccountCard title={t("usernameTitle")} intro={t("usernameIntro")}>
      {state.errorMessage ? (
        <p
          data-testid="username-error"
          className="mb-4 text-red-700 dark:text-red-400"
        >
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
