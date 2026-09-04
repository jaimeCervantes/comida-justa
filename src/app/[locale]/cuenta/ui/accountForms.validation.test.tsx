import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Seller } from "~/domain/entities/seller/types";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AddBranchForm from "./AddBranchForm";
import BecomeSellerForm from "./BecomeSellerForm";
import StoreProfileForm from "./StoreProfileForm";
import UsernameSection from "./UsernameSection";

afterEach(cleanup);

function seller(overrides: Partial<Seller> = {}): Seller {
  return {
    id: "seller-1",
    name: "Panadería La Luz",
    handle: "panaderia-la-luz",
    phone: "2781092116",
    description: "Pan de masa madre horneado cada mañana.",
    logoUrl: null,
    url: null,
    userId: "user-1",
    ...overrides,
  };
}

describe("formularios de cuenta — validación visible", () => {
  it("AddBranchForm bloquea el envío inválido con el mensaje del catálogo", async () => {
    const action = vi.fn(async () => ({}));

    renderWithIntl(<AddBranchForm action={action} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar sucursal" }),
    );

    expect(
      screen.getByRole("form", { name: "Agrega una sucursal" }),
    ).toHaveAttribute("novalidate");
    expect(await screen.findAllByText("Falta llenar este campo.")).toHaveLength(
      2,
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("BecomeSellerForm bloquea el envío inválido con el mensaje del catálogo", async () => {
    const action = vi.fn(async () => ({}));

    renderWithIntl(<BecomeSellerForm action={action} />);

    await userEvent.click(
      screen.getByRole("button", { name: "Abrir mi tienda" }),
    );

    expect(
      screen.getByRole("form", { name: "Abre tu tienda" }),
    ).toHaveAttribute("novalidate");
    expect(await screen.findAllByText("Falta llenar este campo.")).toHaveLength(
      2,
    );
    expect(action).not.toHaveBeenCalled();
  });

  it("StoreProfileForm bloquea un teléfono vacío con el mensaje del catálogo", async () => {
    const action = vi.fn(async () => ({}));

    renderWithIntl(
      <StoreProfileForm action={action} seller={seller({ phone: "" })} />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Guardar ficha" }),
    );

    expect(
      screen.getByRole("form", { name: "Edita la ficha de tu tienda" }),
    ).toHaveAttribute("novalidate");
    expect(
      await screen.findByText("Falta llenar este campo."),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });

  it("UsernameSection bloquea el envío inválido con el mensaje del catálogo", async () => {
    const action = vi.fn(async () => ({}));

    renderWithIntl(<UsernameSection action={action} defaultName="" />);

    await userEvent.click(
      screen.getByRole("button", { name: "Reservar mi dirección" }),
    );

    expect(
      screen.getByRole("form", { name: "Elige tu dirección personal" }),
    ).toHaveAttribute("novalidate");
    expect(
      await screen.findByText("Falta llenar este campo."),
    ).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });
});
