import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ImageWithSkeleton from "./ImageWithSkeleton";

const URL_REAL =
  "https://firebasestorage.googleapis.com/v0/b/test/o/jugo-verde.jpg?alt=media";

function renderImage(props: Record<string, unknown> = {}) {
  return render(
    <ImageWithSkeleton
      src={URL_REAL}
      alt="Jugo Verde"
      width={112}
      height={112}
      {...props}
    />,
  );
}

describe("ImageWithSkeleton", () => {
  it("late mientras la imagen no ha llegado", () => {
    renderImage();

    expect(screen.getByTestId("media-skeleton")).toBeInTheDocument();
  });

  /*
   * La espera no es cosmetica. `next/image` no llama al `onLoad` de quien lo usa en el mismo evento:
   * lo pone detras de `img.decode()`, asi que el aviso llega un microtask despues. Afirmar en seco
   * pasaba a veces y fallaba otras, que es la peor clase de prueba.
   */
  it("deja de latir cuando la imagen carga", async () => {
    renderImage();

    fireEvent.load(screen.getByRole("img"));

    await waitFor(() =>
      expect(screen.queryByTestId("media-skeleton")).not.toBeInTheDocument(),
    );
  });

  /* Una imagen rota dejaba el esqueleto latiendo para siempre, y eso se lee como "sigue cargando":
     quien mira espera algo que no va a llegar. */
  it("tampoco se queda latiendo si la imagen falla", () => {
    renderImage();

    fireEvent.error(screen.getByRole("img"));

    expect(screen.queryByTestId("media-skeleton")).not.toBeInTheDocument();
  });

  /*
   * El caso que no se ve venir: la imagen ya estaba en cache y el navegador la decodifico ANTES de
   * que React hidratara. El `load` ya ocurrio y no vuelve a ocurrir, asi que sin mirar `complete` el
   * esqueleto se quedaba encima de una imagen perfectamente visible.
   */
  it("no late por una imagen que ya estaba en caché", () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(
      true,
    );

    renderImage();

    expect(screen.queryByTestId("media-skeleton")).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("sigue siendo la imagen que le pidieron, con sus atributos", () => {
    renderImage({ "data-testid": "thumbnail", sizes: "112px" });

    const image = screen.getByTestId("thumbnail");

    expect(image).toHaveAttribute("width", "112");
    expect(image).toHaveAttribute("sizes", "112px");
  });

  it("avisa hacia fuera de que cargó, para quien lo necesite", async () => {
    const onLoad = vi.fn();
    renderImage({ onLoad });

    fireEvent.load(screen.getByRole("img"));

    await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
  });
});
