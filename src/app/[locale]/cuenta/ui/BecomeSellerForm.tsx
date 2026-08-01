"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { MdPhone, MdStorefront } from "react-icons/md";
import { generateSellerHandle } from "~/domain/entities/seller/handle";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import type { BecomeSellerState } from "../actions";
import { storePath } from "../storePath";

export const BECOME_SELLER_TITLE = "Vende lo que haces";

export const BECOME_SELLER_INTRO =
  "Abre tu tienda y ten una sola dirección que dar a tus clientes: ahí aparece todo lo que publiques.";

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
      <h1 className="text-xl font-bold mb-2">{BECOME_SELLER_TITLE}</h1>
      <p className="mb-6">{BECOME_SELLER_INTRO}</p>

      {state.errorMessage ? (
        <p
          data-testid="become-seller-error"
          className="mb-4 text-red-700 dark:text-red-400"
        >
          {state.errorMessage}
        </p>
      ) : null}

      <form action={becomeSellerAction} aria-label="Abre tu tienda">
        <TextField
          required
          autoFocus
          name="name"
          type="text"
          label="Nombre de tu tienda:"
          placeholder="Ej: Panadería La Luz"
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
          label="Teléfono de contacto:"
          pattern={"^\\+?(\\d{1,3})?[0-9]{10}$"}
          placeholder="Ej: 2781092116"
          icon={<MdPhone />}
          containerClassName="mb-6"
        />

        <TextArea
          name="description"
          label="¿Qué vendes? (opcional)"
          rows={4}
          placeholder="Pan de masa madre horneado cada mañana."
          className="mb-6"
        />

        <footer className="flex justify-center gap-5 mt-4">
          <Link href="/">
            <Button>Cancelar</Button>
          </Link>

          <Button
            type="submit"
            color="green"
            isLoading={isPending}
            disabled={isPending}
          >
            Abrir mi tienda
          </Button>
        </footer>
      </form>
    </section>
  );
}

function StoreReadyMessage({ handle }: { handle: string }) {
  return (
    <section data-testid="store-ready">
      <h1 className="text-xl font-bold mb-2">Tu tienda ya está en línea</h1>
      <p className="mb-4">
        Comparte esta dirección con tus clientes; todo lo que publiques aparece
        ahí.
      </p>
      <Link
        href={storePath(handle)}
        className="font-bold text-pw-orange break-all"
      >
        {`${PUBLIC_BASE_URL}${storePath(handle)}`}
      </Link>
    </section>
  );
}
