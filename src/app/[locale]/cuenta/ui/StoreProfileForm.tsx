"use client";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useCallback, useState } from "react";
import { MdLink, MdPhone, MdStorefront } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Alert } from "~/presentation/design_system/feedback/Alert";
import { FieldGroup } from "~/presentation/design_system/forms/FieldGroup";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { usePhoneValidationMessages } from "~/presentation/forms/usePhoneValidationMessages";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import StoreLogo from "~/presentation/identity/StoreLogo";
import ImageVideoUploader, {
  type UploadedMediaResult,
} from "~/presentation/media/ImageVideoUploader/ImageVideoUploader";
import type { StoreProfileState } from "../actions";
import { storePath } from "../storePath";
import AccountCard from "./AccountCard";

const LOGO_PREVIEW_SIZE = 64;

/**
 * La ficha de la tienda: lo que se puede corregir de ella.
 *
 * **Los campos van en tres tramos y no en una lista de cinco.** Nombre, descripción, teléfono, sitio
 * web y logo caían seguidos, cada uno con su propio `mb-6`, y no había forma de saber de un vistazo
 * cuántas decisiones distintas se estaban pidiendo. Ahora son tres preguntas —quién eres, cómo te
 * escriben, cómo te ven— y cada una se anuncia con su nombre gracias al `<fieldset>` de `FieldGroup`.
 *
 * **El logo que ya tienes se ve.** El selector decía «Cambia tu logo» sin enseñar cuál, así que para
 * saber si valía la pena cambiarlo había que abrir la tienda en otra pestaña. Ahora está al lado, y
 * al subir uno nuevo la vista previa pasa a ser el nuevo: lo que se ve es lo que va a quedar.
 *
 * **Los avisos son los del sistema.** Guardado y error iban en dos `<p>` de colores elegidos a mano
 * (`text-pw-green`, `text-brand-clay-700`), sin `role`, así que un lector de pantalla no anunciaba
 * nada al guardar. `Alert` decide el `role` por el tono —un error interrumpe, una confirmación
 * espera— y obliga a poner la etiqueta escrita, para quien no distingue verde de rojo.
 */
export default function StoreProfileForm({
  id,
  action,
  seller,
}: {
  /** El ancla del bloque, de `anchors.ts`. */
  id?: string;
  action: (
    state: StoreProfileState,
    data: FormData,
  ) => Promise<StoreProfileState>;
  seller: Seller;
}) {
  const t = useTranslations("account");
  const tCommon = useTranslations("common");
  const locale = resolveLocale(useLocale());
  const phoneMessages = usePhoneValidationMessages();
  const [state, updateAction, isPending] = useActionState<
    StoreProfileState,
    FormData
  >(action, {});
  const [logoUrl, setLogoUrl] = useState<string>("");

  /* El logo es uno solo, así que se toma el primero de la tanda: el selector de aquí no lleva
     `multiple`, con lo que la lista nunca trae más de un elemento. */
  const onLogoUploaded = useCallback((data: UploadedMediaResult | null) => {
    setLogoUrl(data?.media?.[0]?.url ?? "");
  }, []);

  /* El recién subido gana sobre el guardado: mientras no se envíe el formulario, lo que se ve es lo
     que va a quedar, no lo que hay. */
  const previewUrl = logoUrl || seller.logoUrl;

  return (
    <AccountCard
      id={id}
      title={t("storeProfileTitle")}
      intro={t.rich("storeAddressStable", {
        address: `${PUBLIC_BASE_URL}${storePath(seller.handle ?? "", locale)}`,
        url: (chunks) => <span className="font-bold">{chunks}</span>,
      })}
    >
      {state.errorMessage ? (
        <Alert
          tone="error"
          label={tCommon("alertError")}
          data-testid="store-profile-error"
          className="mb-5"
        >
          {state.errorMessage}
        </Alert>
      ) : null}

      {state.saved ? (
        <Alert
          tone="success"
          label={tCommon("alertSaved")}
          data-testid="store-profile-saved"
          className="mb-5"
        >
          {t("storeProfileSaved")}
        </Alert>
      ) : null}

      <ValidatedForm
        action={updateAction}
        aria-label={t("storeProfileFormLabel")}
      >
        {/* La pila va en un envoltorio y no en el `<form>`: `ValidatedForm` pinta antes la leyenda
            del asterisco con su propio margen, y sumarle el `gap` dejaba un hueco de 44px que no
            había decidido nadie. */}
        <div className="flex flex-col gap-7">
          <FieldGroup
            legend={t("storeGroupIdentity")}
            hint={t("storeGroupIdentityHint")}
            testId="store-group-identity"
          >
            <TextField
              required
              name="name"
              type="text"
              autoComplete="organization"
              label={t("storeName")}
              defaultValue={seller.name}
              icon={<MdStorefront />}
            />

            <TextArea
              name="description"
              label={t("storeDescriptionRequired")}
              rows={4}
              defaultValue={seller.description ?? ""}
            />
          </FieldGroup>

          <FieldGroup
            legend={t("storeGroupContact")}
            hint={t("storeGroupContactHint")}
            testId="store-group-contact"
          >
            <TextField
              required
              name="phone"
              type="tel"
              autoComplete="tel"
              label={t("storePhone")}
              pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
              validationMessages={phoneMessages}
              defaultValue={seller.phone}
              icon={<MdPhone />}
            />

            <TextField
              name="url"
              type="url"
              autoComplete="url"
              label={t("storeWebsite")}
              placeholder={t("storeWebsitePlaceholder")}
              defaultValue={seller.url ?? ""}
              icon={<MdLink />}
            />
          </FieldGroup>

          <FieldGroup
            legend={t("storeGroupImage")}
            hint={t("storeGroupImageHint")}
            testId="store-group-image"
          >
            <div className="flex items-start gap-4">
              <div data-testid="store-logo-preview" className="shrink-0">
                {/* El mismo `StoreLogo` del resto del sitio: la vista previa tiene que enseñar lo que
                  se va a ver, no una versión propia. Cae a la inicial cuando no hay ninguno. */}
                <StoreLogo
                  logoUrl={previewUrl}
                  name={seller.name}
                  size={LOGO_PREVIEW_SIZE}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm text-text-support">
                  {previewUrl ? t("storeLogoCurrent") : t("storeLogoNone")}
                </p>

                <ImageVideoUploader
                  label={t(
                    seller.logoUrl ? "storeLogoChange" : "storeLogoUpload",
                  )}
                  name=""
                  directory="sellers"
                  onUploaded={onLogoUploaded}
                  accept="image/*"
                  required={false}
                  /* Los textos de progreso llevaban su propio español dentro del uploader: quien
                   subiera un logo en inglés leía «⏳ Subiendo...» en medio de su idioma. */
                  uploadingLabel={(progress) =>
                    t("storeLogoUploading", { progress: Math.round(progress) })
                  }
                  uploadedLabel={() => t("storeLogoUploaded")}
                />
              </div>
            </div>
          </FieldGroup>

          {/* Vacío significa "no subí uno nuevo": el caso de uso conserva el que había. */}
          <input type="hidden" name="logoUrl" value={logoUrl} />

          <Button
            type="submit"
            color="green"
            isLoading={isPending}
            disabled={isPending}
            className="self-start"
          >
            {t("storeProfileSubmit")}
          </Button>
        </div>
      </ValidatedForm>
    </AccountCard>
  );
}
