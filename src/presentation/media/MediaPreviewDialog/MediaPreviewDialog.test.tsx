import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import MediaPreviewDialog from "./MediaPreviewDialog";

const IMAGE = {
  url: "https://firebasestorage.googleapis.com/v0/b/test/o/etiqueta.jpg",
  type: "image",
  alt: "Etiqueta del frasco",
} as const;

function render(props: Partial<Parameters<typeof MediaPreviewDialog>[0]> = {}) {
  const onClose = vi.fn();

  renderWithIntl(
    <MediaPreviewDialog
      item={IMAGE}
      title="Archivo 2 en grande"
      closeLabel="Cerrar la vista"
      onClose={onClose}
      {...props}
    />,
  );

  return { onClose };
}

describe("MediaPreviewDialog", () => {
  it("se anuncia como una vista modal con nombre propio", () => {
    render();

    const dialog = screen.getByRole("dialog");

    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("Archivo 2 en grande");
  });

  /* El foco es la mitad del trabajo de un modal escrito a mano: sin el, `Escape` se lo queda la
     pagina de detras y tabular sigue recorriendo un formulario que ya no se ve. */
  it("se lleva el foco al abrirse", () => {
    render();

    expect(screen.getByRole("button", { name: /cerrar/i })).toHaveFocus();
  });

  it("cierra con Escape", async () => {
    const { onClose } = render();

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cierra con el boton de cerrar", async () => {
    const { onClose } = render();

    await userEvent.click(screen.getByRole("button", { name: /cerrar/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cierra al tocar el fondo", async () => {
    const { onClose } = render();

    await userEvent.click(screen.getByTestId("media-preview"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /* Tocar la propia foto para verla mejor es el gesto mas natural que hay, y si eso cerrara la
     vista, la vista seria inservible con raton. */
  it("no cierra al tocar el archivo", async () => {
    const { onClose } = render();

    await userEvent.click(screen.getByRole("img"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("pinta un video como video, con sus controles", () => {
    render({
      item: {
        url: "https://firebasestorage.googleapis.com/v0/b/test/o/receta.mp4",
        type: "video",
        alt: "Como se prepara",
      },
    });

    const video = document.querySelector("video");

    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("controls");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
