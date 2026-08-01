"use client";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { MdAlternateEmail } from "react-icons/md";
import { generateUsername } from "~/domain/entities/user/username";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextField } from "~/presentation/design_system/forms/TextField";
import type { ClaimUsernameState } from "../actions";
import { profilePath } from "../profilePath";

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
  const [state, claimAction, isPending] = useActionState<
    ClaimUsernameState,
    FormData
  >(action, {});
  const [requested, setRequested] = useState<string>(defaultName ?? "");

  const username = currentUsername ?? state.username;

  if (username) {
    return (
      <section data-testid="username-card">
        <h2 className="text-lg font-bold mb-2">{t("usernameTitle")}</h2>
        <Link
          href={profilePath(username)}
          className="font-bold text-pw-orange break-all"
        >
          {`${PUBLIC_BASE_URL}${profilePath(username)}`}
        </Link>
      </section>
    );
  }

  // Se calcula con la MISMA función del dominio que corre en el servidor: lo que se lee aquí
  // es lo que va a quedar guardado.
  const preview = generateUsername(requested);

  return (
    <section>
      <h2 className="text-lg font-bold mb-2">{t("usernameTitle")}</h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {t("usernameIntro")}
      </p>

      {state.errorMessage ? (
        <p
          data-testid="username-error"
          className="mb-4 text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <form action={claimAction} aria-label={t("usernameFormLabel")}>
        <TextField
          required
          name="username"
          type="text"
          label={t("username")}
          placeholder={t("usernamePlaceholder")}
          icon={<MdAlternateEmail />}
          value={requested}
          onChange={(event) => setRequested(event.target.value)}
          containerClassName="mb-2"
        />

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Tu perfil quedará en{" "}
          <span data-testid="username-preview" className="font-bold">
            {`${PUBLIC_BASE_URL}${profilePath(preview || "…")}`}
          </span>
        </p>

        <Button
          type="submit"
          color="green"
          isLoading={isPending}
          disabled={isPending}
        >
          {t("usernameSubmit")}
        </Button>
      </form>
    </section>
  );
}
