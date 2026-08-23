import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/* El último salto del viaje de vuelta no es una navegación sino esta llamada, así que el doble es
   justo lo que se está afirmando. `getProviders` va con un solo proveedor: el escenario es a dónde
   se sale, no cuántas puertas hay. */
const signIn = vi.fn();

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signIn(...args),
  getProviders: () =>
    Promise.resolve({ google: { id: "google", name: "Google" } }),
}));

import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import SignInOptions from "./SignInOptions";

describe("La pantalla de acceso", () => {
  /* Sin pasarlo, next-auth usa por omisión `window.location.href` —o sea esta misma pantalla—, y
     ahí es donde se perdía el destino que la ficha del evento había escrito en la dirección. */
  it("reenvía a next-auth el destino que recibió", async () => {
    renderWithIntl(<SignInOptions callbackUrl="/caminata-a-la-luisa" />);

    const boton = await screen.findByRole("button", {
      name: /sign in with google/i,
    });

    await userEvent.click(boton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("google", {
        callbackUrl: "/caminata-a-la-luisa",
      });
    });
  });
});
