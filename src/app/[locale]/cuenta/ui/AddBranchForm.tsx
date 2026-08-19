"use client";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { MdMyLocation, MdPlace, MdStorefront } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import type { AddBranchState } from "../actions";
import AccountCard from "./AccountCard";

type GeolocationState = "idle" | "locating" | "located" | "failed";

export default function AddBranchForm({
  action,
}: {
  action: (state: AddBranchState, data: FormData) => Promise<AddBranchState>;
}) {
  const t = useTranslations("account");
  const [state, addBranchAction, isPending] = useActionState<
    AddBranchState,
    FormData
  >(action, {});
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [geolocation, setGeolocation] = useState<GeolocationState>("idle");

  const useMyLocation = (): void => {
    if (!navigator.geolocation) {
      setGeolocation("failed");
      return;
    }

    setGeolocation("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeolocation("located");
      },
      () => setGeolocation("failed"),
    );
  };

  return (
    <AccountCard title={t("addBranchTitle")} intro={t("addBranchIntro")}>
      {state.errorMessage ? (
        <p
          data-testid="add-branch-error"
          className="mb-4 text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <ValidatedForm
        action={addBranchAction}
        aria-label={t("addBranchFormLabel")}
      >
        <TextField
          required
          name="name"
          type="text"
          autoComplete="organization"
          label={t("branchName")}
          placeholder={t("branchNamePlaceholder")}
          icon={<MdStorefront />}
          containerClassName="mb-6"
        />

        <TextField
          required
          name="address"
          type="text"
          autoComplete="street-address"
          label={t("branchAddress")}
          placeholder={t("branchAddressPlaceholder")}
          icon={<MdPlace />}
          containerClassName="mb-6"
        />

        <TextField
          name="mapUrl"
          type="url"
          autoComplete="url"
          label={t("branchMapsLink")}
          placeholder="https://maps.app.goo.gl/…"
          hint={t("branchMapsHint")}
          icon={<MdPlace />}
          containerClassName="mb-4"
        />

        {/* El GPS del navegador solo puede pedirse desde el cliente, así que viaja en campos
            ocultos: el servidor recibe coordenadas, no un permiso del navegador. */}
        <input
          type="hidden"
          name="latitude"
          value={coordinates?.latitude ?? ""}
        />
        <input
          type="hidden"
          name="longitude"
          value={coordinates?.longitude ?? ""}
        />

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={useMyLocation}
            startIcon={<MdMyLocation />}
            size="sm"
            isLoading={geolocation === "locating"}
          >
            {t("useMyLocation")}
          </Button>

          <span
            data-testid="geolocation-status"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {t(geolocationMessageKey(geolocation))}
          </span>
        </div>

        <footer className="flex justify-center gap-5 mt-4">
          <Button
            type="submit"
            color="green"
            isLoading={isPending}
            disabled={isPending}
          >
            {t("saveBranch")}
          </Button>
        </footer>
      </ValidatedForm>
    </AccountCard>
  );
}

/**
 * Devuelve la **clave** del mensaje, no el texto: así el estado de la geolocalización sigue siendo
 * una función pura y comprobable, y la redacción vive donde vive el resto.
 */
function geolocationMessageKey(
  state: GeolocationState,
): "locationTaken" | "locationFailed" | "locating" | "locationHint" {
  if (state === "located") return "locationTaken";
  if (state === "failed") return "locationFailed";
  if (state === "locating") return "locating";

  return "locationHint";
}
