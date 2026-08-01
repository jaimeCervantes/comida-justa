"use client";
import { useActionState, useState } from "react";
import { MdMyLocation, MdPlace, MdStorefront } from "react-icons/md";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextField } from "~/presentation/design_system/forms/TextField";
import type { AddBranchState } from "../actions";

export const ADD_BRANCH_TITLE = "Agrega una sucursal";

export const ADD_BRANCH_INTRO =
  "Con su ubicación en el mapa, el chatbot puede recomendarte a quien está cerca. Sin ella, apareces solo en las búsquedas sin ubicación.";

type GeolocationState = "idle" | "locating" | "located" | "failed";

export default function AddBranchForm({
  action,
}: {
  action: (state: AddBranchState, data: FormData) => Promise<AddBranchState>;
}) {
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
    <section className="mt-10">
      <h2 className="text-lg font-bold mb-2">{ADD_BRANCH_TITLE}</h2>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {ADD_BRANCH_INTRO}
      </p>

      {state.errorMessage ? (
        <p
          data-testid="add-branch-error"
          className="mb-4 text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <form action={addBranchAction} aria-label="Agrega una sucursal">
        <TextField
          required
          name="name"
          type="text"
          label="Nombre de la sucursal:"
          placeholder="Ej: Sucursal Centro"
          icon={<MdStorefront />}
          containerClassName="mb-6"
        />

        <TextField
          required
          name="address"
          type="text"
          label="Dirección:"
          placeholder="Calle, número, colonia, ciudad"
          icon={<MdPlace />}
          containerClassName="mb-6"
        />

        <TextField
          name="mapUrl"
          type="url"
          label="Enlace de Google Maps:"
          placeholder="https://maps.app.goo.gl/…"
          hint="Búscate en Google Maps y usa «Compartir», o copia la dirección de la barra."
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
            Usar mi ubicación actual
          </Button>

          <span
            data-testid="geolocation-status"
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {geolocationMessage(geolocation)}
          </span>
        </div>

        <footer className="flex justify-center gap-5 mt-4">
          <Button
            type="submit"
            color="green"
            isLoading={isPending}
            disabled={isPending}
          >
            Guardar sucursal
          </Button>
        </footer>
      </form>
    </section>
  );
}

function geolocationMessage(state: GeolocationState): string {
  if (state === "located") return "Ubicación tomada de tu dispositivo.";
  if (state === "failed")
    return "No se pudo leer tu ubicación; pega el enlace de Maps.";
  if (state === "locating") return "Buscando dónde estás…";

  return "Úsalo si estás parado en tu local.";
}
