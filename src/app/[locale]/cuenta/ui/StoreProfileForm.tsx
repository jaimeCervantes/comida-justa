"use client";
import { useActionState, useCallback, useState } from "react";
import { MdLink, MdPhone, MdStorefront } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import ImageVideoUploader, {
  type UploadedMediaResult,
} from "~/infra/UI/components/ImageVideoUploader/ImageVideoUploader";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import type { StoreProfileState } from "../actions";
import { storePath } from "../storePath";

export const STORE_PROFILE_TITLE = "La ficha de tu tienda";

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
  const [state, updateAction, isPending] = useActionState<
    StoreProfileState,
    FormData
  >(action, {});
  const [logoUrl, setLogoUrl] = useState<string>("");

  const onLogoUploaded = useCallback((data: UploadedMediaResult | null) => {
    setLogoUrl(data?.media?.url ?? "");
  }, []);

  return (
    <section>
      <h2 className="text-lg font-bold mb-2">{STORE_PROFILE_TITLE}</h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Tu dirección{" "}
        <span className="font-bold">
          {`${PUBLIC_BASE_URL}${storePath(seller.handle ?? "")}`}
        </span>{" "}
        no cambia aunque cambies el nombre: así los enlaces que ya repartiste
        siguen funcionando.
      </p>

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
          Ficha guardada.
        </p>
      ) : null}

      <form action={updateAction} aria-label="Edita la ficha de tu tienda">
        <TextField
          required
          name="name"
          type="text"
          label="Nombre de tu tienda:"
          defaultValue={seller.name}
          icon={<MdStorefront />}
          containerClassName="mb-6"
        />

        <TextField
          required
          name="phone"
          type="tel"
          label="Teléfono de contacto:"
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          defaultValue={seller.phone}
          icon={<MdPhone />}
          containerClassName="mb-6"
        />

        <TextField
          name="url"
          type="url"
          label="Sitio web (opcional):"
          placeholder="https://mitienda.mx"
          defaultValue={seller.url ?? ""}
          icon={<MdLink />}
          containerClassName="mb-6"
        />

        <TextArea
          name="description"
          label="¿Qué vendes?"
          rows={4}
          defaultValue={seller.description ?? ""}
          className="mb-6"
        />

        <ImageVideoUploader
          label={seller.logoUrl ? "Cambia tu logo" : "Sube tu logo"}
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
          Guardar ficha
        </Button>
      </form>
    </section>
  );
}
