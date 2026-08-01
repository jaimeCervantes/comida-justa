"use client";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { MdPhone, MdStorefront } from "react-icons/md";
import { generateSellerHandle } from "~/domain/entities/seller/handle";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import type { BecomeSellerState } from "../actions";
import { storePath } from "../storePath";

export default function BecomeSellerForm({
  action,
  defaultName,
}: {
  action: (
    state: BecomeSellerState,
    data: FormData,
  ) => Promise<BecomeSellerState>;
  /** El nombre de la cuenta, como punto de partida del nombre de la tienda. */
  defaultName?: string | null;
}) {
  const t = useTranslations("account");
  const [state, becomeSellerAction, isPending] = useActionState<
    BecomeSellerState,
    FormData
  >(action, {});
  const [name, setName] = useState<string>(defaultName ?? "");

  // La dirección se calcula con la MISMA función del dominio que usa el servidor, así que lo
  // que se ve aquí es lo que va a quedar guardado, no una aproximación.
  const handlePreview = generateSellerHandle(name);

  if (state.handle) {
    return <StoreReadyMessage handle={state.handle} />;
  }

  return (
    <section>
      <h1 className="text-xl font-bold mb-2">{t("becomeSellerTitle")}</h1>
      <p className="mb-6">{t("becomeSellerIntro")}</p>

      {state.errorMessage ? (
        <p
          data-testid="become-seller-error"
          className="mb-4 text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <form action={becomeSellerAction} aria-label={t("becomeSellerFormLabel")}>
        <TextField
          required
          autoFocus
          name="name"
          type="text"
          label={t("storeName")}
          placeholder={t("storeNamePlaceholder")}
          icon={<MdStorefront />}
          value={name}
          onChange={(event) => setName(event.target.value)}
          containerClassName="mb-2"
        />

        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Tu tienda quedará en{" "}
          <span data-testid="handle-preview" className="font-bold">
            {`${PUBLIC_BASE_URL}${storePath(handlePreview || "…")}`}
          </span>
        </p>

        <TextField
          required
          name="phone"
          type="tel"
          label={t("storePhone")}
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          placeholder={t("storePhonePlaceholder")}
          icon={<MdPhone />}
          containerClassName="mb-6"
        />

        <TextArea
          name="description"
          label={t("storeDescription")}
          rows={4}
          placeholder={t("storeDescriptionPlaceholder")}
          className="mb-6"
        />

        <footer className="flex justify-center gap-5 mt-4">
          <Link href="/">
            <Button>{t("cancel")}</Button>
          </Link>

          <Button
            type="submit"
            color="green"
            isLoading={isPending}
            disabled={isPending}
          >
            {t("becomeSellerSubmit")}
          </Button>
        </footer>
      </form>
    </section>
  );
}

function StoreReadyMessage({ handle }: { handle: string }) {
  const t = useTranslations("account");

  return (
    <section data-testid="store-ready">
      <h1 className="text-xl font-bold mb-2">{t("becomeSellerOnline")}</h1>
      <p className="mb-4">{t("becomeSellerShare")}</p>
      <Link
        href={storePath(handle)}
        className="font-bold text-pw-orange break-all"
      >
        {`${PUBLIC_BASE_URL}${storePath(handle)}`}
      </Link>
    </section>
  );
}
