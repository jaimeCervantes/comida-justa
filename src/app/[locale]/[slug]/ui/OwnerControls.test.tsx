import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import type { AvailabilityState } from "~/presentation/post/availabilityAction";
import type { StockState } from "~/presentation/post/stockAction";
import OwnerControls from "./OwnerControls";

const noopAvailability = async (): Promise<AvailabilityState> => ({});
const noopStock = async (): Promise<StockState> => ({});

function render(props: Partial<Parameters<typeof OwnerControls>[0]> = {}) {
  return renderWithIntl(
    <OwnerControls
      action={noopAvailability}
      stockAction={noopStock}
      postId="post-1"
      slug="dona-chocolate-keto"
      kind="producto"
      isAvailable={true}
      isSellable={true}
      stockQuantity={null}
      canEdit={true}
      {...props}
    />,
  );
}

const editButton = () => screen.queryByRole("link", { name: /editar/i });
const manualToggle = () =>
  screen.queryByRole("button", { name: /agotado|disponible/i });

describe("OwnerControls", () => {
  it("quien publicó edita, agota a mano y lleva el inventario", () => {
    render();

    expect(editButton()).toBeInTheDocument();
    expect(manualToggle()).toBeInTheDocument();
    expect(screen.getByTestId("stock-control")).toBeInTheDocument();
  });

  /* La segunda vía de autorización sólo alcanza al inventario: el texto sigue siendo de quien lo
     escribió, y `UpdateOnePostUseCase` se lo negaría. Enseñarle el botón sería mentirle. */
  it("quien lleva la tienda administra el inventario, pero no edita lo ajeno", () => {
    render({ canEdit: false });

    expect(editButton()).not.toBeInTheDocument();
    expect(manualToggle()).not.toBeInTheDocument();
    expect(screen.getByTestId("stock-control")).toBeInTheDocument();
  });

  /* Dos mandos para lo mismo pueden contradecirse: un producto agotado a mano con 5 unidades
     guardadas no sabría qué contestar. */
  it("en cuanto lleva inventario, el interruptor manual desaparece", () => {
    render({ stockQuantity: 5 });

    expect(manualToggle()).not.toBeInTheDocument();
    expect(screen.getByTestId("stock-control")).toBeInTheDocument();
  });

  it("un anuncio no cuenta ejemplares ni se agota: sólo se edita", () => {
    render({ kind: "anuncio", isSellable: false });

    expect(editButton()).toBeInTheDocument();
    expect(manualToggle()).not.toBeInTheDocument();
    expect(screen.queryByTestId("stock-control")).not.toBeInTheDocument();
  });

  /* Un servicio se vende pero no se entrega en piezas: conserva su interruptor y no gana campo. */
  it("un servicio conserva el interruptor y no gana campo de existencias", () => {
    render({ kind: "servicio" });

    expect(manualToggle()).toBeInTheDocument();
    expect(screen.queryByTestId("stock-control")).not.toBeInTheDocument();
  });
});
