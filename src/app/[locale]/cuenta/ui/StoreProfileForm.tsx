"use client";
import { useLocale, useTranslations } from "next-intl";
import { useActionState, useCallback, useState } from "react";
import { MdLink, MdPhone, MdStorefront } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { usePhoneValidationMessages } from "~/presentation/forms/usePhoneValidationMessages";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import ImageVideoUploader, {
  type UploadedMediaResult,
} from "~/presentation/media/ImageVideoUploader/ImageVideoUploader";
import type { StoreProfileState } from "../actions";
import { storePath } from "../storePath";
import AccountCard from "./AccountCard";

export default function StoreProfileForm({
  action,
  seller,
}: {
  action: (
    state: StoreProfileState,
    data: FormData,
  ) => Promise<StoreProfileState>;
  seller: Seller;
}) {
  const t = useTranslations("account");
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

  return (
    <AccountCard
      title={t("storeProfileTitle")}
      intro={t.rich("storeAddressStable", {
        address: `${PUBLIC_BASE_URL}${storePath(seller.handle ?? "", locale)}`,
        url: (chunks) => <span className="font-bold">{chunks}</span>,
      })}
    >
      {state.errorMessage ? (
        <p
          data-testid="store-profile-error"
          className="mb-4 text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </p>
      ) : null}

      {state.saved ? (
        <p data-testid="store-profile-saved" className="mb-4 text-pw-green">
          {t("storeProfileSaved")}
        </p>
      ) : null}

      <ValidatedForm
        action={updateAction}
        aria-label={t("storeProfileFormLabel")}
      >
        <TextField
          required
          name="name"
          type="text"
          autoComplete="organization"
          label={t("storeName")}
          defaultValue={seller.name}
          icon={<MdStorefront />}
          containerClassName="mb-6"
        />

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
          containerClassName="mb-6"
        />

        <TextField
          name="url"
          type="url"
          autoComplete="url"
          label={t("storeWebsite")}
          placeholder={t("storeWebsitePlaceholder")}
          defaultValue={seller.url ?? ""}
          icon={<MdLink />}
          containerClassName="mb-6"
        />

        <TextArea
          name="description"
          label={t("storeDescriptionRequired")}
          rows={4}
          defaultValue={seller.description ?? ""}
          className="mb-6"
        />

        <ImageVideoUploader
          label={t(seller.logoUrl ? "storeLogoChange" : "storeLogoUpload")}
          name=""
          directory="sellers"
          onUploaded={onLogoUploaded}
          accept="image/*"
          required={false}
          className="mb-6"
        />

        {/* Vacío significa "no subí uno nuevo": el caso de uso conserva el que había. */}
        <input type="hidden" name="logoUrl" value={logoUrl} />

        <Button
          type="submit"
          color="green"
          isLoading={isPending}
          disabled={isPending}
        >
          {t("storeProfileSubmit")}
        </Button>
      </ValidatedForm>
    </AccountCard>
  );
}
