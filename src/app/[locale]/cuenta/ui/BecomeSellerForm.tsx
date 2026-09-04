"use client";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { MdPhone, MdStorefront } from "react-icons/md";
import { generateSellerHandle } from "~/domain/entities/seller/handle";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { usePhoneValidationMessages } from "~/presentation/forms/usePhoneValidationMessages";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import type { BecomeSellerState } from "../actions";
import { storePath } from "../storePath";
import AccountCard from "./AccountCard";

export default function BecomeSellerForm({
  id,
  action,
  defaultName,
}: {
  /** El ancla del bloque, de `anchors.ts`. */
  id?: string;
  action: (
    state: BecomeSellerState,
    data: FormData,
  ) => Promise<BecomeSellerState>;
  /** El nombre de la cuenta, como punto de partida del nombre de la tienda. */
  defaultName?: string | null;
}) {
  const t = useTranslations("account");
  const locale = resolveLocale(useLocale());
  const phoneMessages = usePhoneValidationMessages();
  const [state, becomeSellerAction, isPending] = useActionState<
    BecomeSellerState,
    FormData
  >(action, {});
  const [name, setName] = useState<string>(defaultName ?? "");

  /*
   * La dirección se calcula con la MISMA función del dominio que usa el servidor, así que lo que se
   * ve aquí es lo que va a quedar guardado, no una aproximación. Es la segunda anotación del 5.15.
   *
   * **Lo que pasa después no lo pinta este componente.** Al abrir la tienda, la Server Action
   * revalida `/cuenta`, y la página vuelve con `StoreCard` en el sitio de este formulario. Vivía
   * aquí un `StoreReadyMessage` que enseñaba la dirección de la tienda recién creada a partir del
   * `handle` devuelto — y **nunca llegaba a pintarse**: comprobado en el navegador, tras un alta
   * correcta hay `store-card` y no aquella tarjeta. Se retiró. Lo que promete el 5.15 para ese
   * momento —camino corto, pestaña nueva y botón de repartir— lo da `StoreCard` con
   * `PublicAddressRow`, que es donde de verdad aterriza quien acaba de abrir su tienda.
   */
  const handlePreview = generateSellerHandle(name);

  return (
    <AccountCard
      id={id}
      title={t("becomeSellerTitle")}
      intro={t("becomeSellerIntro")}
    >
      {state.errorMessage ? (
        <p
          data-testid="become-seller-error"
          className="mb-4 text-brand-clay-700"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <ValidatedForm
        action={becomeSellerAction}
        aria-label={t("becomeSellerFormLabel")}
      >
        <TextField
          required
          autoFocus
          name="name"
          type="text"
          autoComplete="organization"
          label={t("storeName")}
          placeholder={t("storeNamePlaceholder")}
          icon={<MdStorefront />}
          value={name}
          onChange={(event) => setName(event.target.value)}
          containerClassName="mb-2"
        />

        <p className="mb-6 text-sm text-text-support">
          {t.rich("storePreview", {
            address: `${PUBLIC_BASE_URL}${storePath(handlePreview || "…", locale)}`,
            url: (chunks) => (
              <span data-testid="handle-preview" className="font-bold">
                {chunks}
              </span>
            ),
          })}
        </p>

        <TextField
          required
          name="phone"
          type="tel"
          autoComplete="tel"
          label={t("storePhone")}
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          validationMessages={phoneMessages}
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
      </ValidatedForm>
    </AccountCard>
  );
}
