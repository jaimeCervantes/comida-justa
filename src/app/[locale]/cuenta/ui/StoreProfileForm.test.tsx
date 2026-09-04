import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Seller } from "~/domain/entities/seller/types";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { StoreProfileState } from "../actions";
import StoreProfileForm from "./StoreProfileForm";

const LOGO = "https://cdn.test/panaderia-la-luz.webp";

function seller(patch: Partial<Seller> = {}): Seller {
  return {
    id: "seller-1",
    name: "Panadería La Luz",
    handle: "panaderia-la-luz",
    phone: "2781092116",
    description: "Pan de masa madre horneado cada mañana.",
    logoUrl: null,
    url: null,
    userId: "user-1",
    ...patch,
  };
}

/**
 * La acción nunca se ejecuta en estas pruebas: lo que se mira es lo que la ficha **pinta** a partir
 * del estado con el que vuelve, no lo que hace el servidor —eso vive en `storeProfile.spec.ts`—.
 */
function renderForm(
  options: {
    seller?: Seller;
    state?: StoreProfileState;
    locale?: "es" | "en";
  } = {},
) {
  const action = vi.fn(async () => options.state ?? {});

  return renderWithIntl(
    <StoreProfileForm
      action={action as never}
      seller={options.seller ?? seller()}
    />,
    options.locale ? { locale: options.locale } : undefined,
  );
}

function group(testId: string): HTMLElement {
  return screen.getByTestId(testId);
}

describe("StoreProfileForm", () => {
  describe("los campos van en tramos, no en una lista larga", () => {
    it("anuncia cada tramo con su nombre", () => {
      renderForm();

      for (const legend of [
        es.account.storeGroupIdentity,
        es.account.storeGroupContact,
        es.account.storeGroupImage,
      ]) {
        expect(
          screen.getByRole("group", { name: new RegExp(legend) }),
        ).toBeInTheDocument();
      }
    });

    /* La corrida de escritorio del `.feature`: cada campo en el tramo que le toca. Se busca dentro
       del grupo y no en la página, que es lo que hace que la prueba diga algo. */
    it.each([
      ["store-group-identity", es.account.storeName],
      ["store-group-identity", es.account.storeDescriptionRequired],
      ["store-group-contact", es.account.storePhone],
      ["store-group-contact", es.account.storeWebsite],
    ])("%s contiene %j", (testId, label) => {
      renderForm();

      expect(
        within(group(testId)).getByRole("textbox", {
          name: new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        }),
      ).toBeInTheDocument();
    });
  });

  describe("el logo que ya tienes se ve", () => {
    it("enseña el guardado antes de que subas ninguno nuevo", () => {
      renderForm({ seller: seller({ logoUrl: LOGO }) });

      const preview = screen.getByTestId("store-logo-preview");

      expect(preview.querySelector("img")).toHaveAttribute(
        "src",
        expect.stringContaining(encodeURIComponent(LOGO)),
      );
      expect(screen.getByText(es.account.storeLogoCurrent)).toBeVisible();
    });

    it("sin logo cae a la inicial, y lo dice", () => {
      renderForm();

      const preview = screen.getByTestId("store-logo-preview");

      expect(within(preview).getByText("P")).toBeInTheDocument();
      expect(preview.querySelector("img")).toBeNull();
      expect(screen.getByText(es.account.storeLogoNone)).toBeVisible();
    });
  });

  describe("los avisos son los del sistema", () => {
    async function submit(): Promise<void> {
      await userEvent.click(
        screen.getByRole("button", { name: es.account.storeProfileSubmit }),
      );
    }

    it("no pinta ningún aviso mientras no haya pasado nada", () => {
      renderForm();

      expect(screen.queryByTestId("store-profile-saved")).toBeNull();
      expect(screen.queryByTestId("store-profile-error")).toBeNull();
    });

    /* `Alert` decide el `role` por el tono: un error interrumpe a un lector de pantalla
       (`role="alert"`) y una confirmación espera su turno (`role="status"`). Antes eran dos `<p>`
       sin `role` ninguno, así que al guardar no se anunciaba nada. */
    it("la confirmación espera turno y lleva su etiqueta escrita", async () => {
      renderForm({ state: { saved: true } });
      await submit();

      const aviso = await screen.findByTestId("store-profile-saved");

      expect(aviso).toHaveAttribute("role", "status");
      expect(aviso).toHaveTextContent(es.common.alertSaved);
      expect(aviso).toHaveTextContent(es.account.storeProfileSaved);
    });

    it("el rechazo interrumpe, y también lleva su etiqueta", async () => {
      const motivo = "Ese teléfono ya está registrado.";
      renderForm({ state: { errorMessage: motivo } });
      await submit();

      const aviso = await screen.findByTestId("store-profile-error");

      expect(aviso).toHaveAttribute("role", "alert");
      expect(aviso).toHaveTextContent(es.common.alertError);
      expect(aviso).toHaveTextContent(motivo);
    });
  });

  /* Estaba en duro dentro de `ImageVideoUploader`: quien subiera un logo en inglés leía
     «⏳ Subiendo...» en medio de su idioma. */
  it("el selector de logo no deja texto en español cuando se mira en inglés", () => {
    const { container } = renderForm({ locale: "en" });

    expect(container.textContent).not.toContain("Subiendo");
    expect(container.textContent).not.toContain("Subido");
  });
});
