import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SoldOutBadge from "./SoldOutBadge";

describe("SoldOutBadge", () => {
  it("marca el producto agotado", () => {
    const { getByTestId } = render(
      <SoldOutBadge kind="producto" isAvailable={false} />,
    );

    expect(getByTestId("sold-out-badge")).toHaveTextContent("Agotado");
  });

  it.each([
    ["hay existencias", "producto", true],
    ["es un anuncio, que no se agota", "anuncio", false],
  ])("no pinta nada cuando %s", (_caso, kind, isAvailable) => {
    const { queryByTestId } = render(
      <SoldOutBadge kind={kind} isAvailable={isAvailable} />,
    );

    expect(queryByTestId("sold-out-badge")).not.toBeInTheDocument();
  });
});
