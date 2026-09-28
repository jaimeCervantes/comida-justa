import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import DeliveryLocationShare from "./DeliveryLocationShare";

const shareDeliveryLocation = vi.fn(async (_data: FormData) => {});

vi.mock("~/presentation/orders/orderActions", () => ({
  shareDeliveryLocation: (data: FormData) => shareDeliveryLocation(data),
}));
vi.mock("~/presentation/location/actions", () => ({ shareLocation: vi.fn() }));

const ORDER_ID = "a7fd1c34-0000-4000-8000-000000000001";

function grantPosition(latitude: number, longitude: number): void {
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: {
      getCurrentPosition: (ok: PositionCallback) =>
        ok({ coords: { latitude, longitude } } as GeolocationPosition),
    },
  });
}

afterEach(() => {
  shareDeliveryLocation.mockClear();
});

describe("DeliveryLocationShare", () => {
  it("sin destino, invita a compartirlo", () => {
    render(<DeliveryLocationShare orderId={ORDER_ID} sharedAt={null} />);

    expect(screen.getByTestId("delivery-location-missing")).toBeInTheDocument();
    expect(screen.getByTestId("share-delivery-location")).toHaveTextContent(
      "Compartir mi ubicación",
    );
  });

  it("con destino, dice que ya se compartió y ofrece actualizarlo", () => {
    render(
      <DeliveryLocationShare
        orderId={ORDER_ID}
        sharedAt={new Date("2026-09-26T17:40:00Z")}
      />,
    );

    expect(screen.getByTestId("delivery-location-shared")).toBeInTheDocument();
    expect(screen.getByTestId("share-delivery-location")).toHaveTextContent(
      "Actualizar mi ubicación",
    );
  });

  /* La posición va al PEDIDO, no a la cuenta: la acción recibe el id del pedido junto a las
     coordenadas. */
  it("manda la posición con el id del pedido", async () => {
    grantPosition(25.6766, -100.3303);
    render(<DeliveryLocationShare orderId={ORDER_ID} sharedAt={null} />);

    fireEvent.click(screen.getByTestId("share-delivery-location"));

    await waitFor(() => expect(shareDeliveryLocation).toHaveBeenCalled());
    const data = shareDeliveryLocation.mock.calls[0][0];
    expect(data.get("orderId")).toBe(ORDER_ID);
    expect(data.get("latitude")).toBe("25.6766");
    expect(data.get("longitude")).toBe("-100.3303");
  });
});
