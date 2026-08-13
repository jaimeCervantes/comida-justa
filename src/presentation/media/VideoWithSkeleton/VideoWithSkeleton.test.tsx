import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import VideoWithSkeleton from "./VideoWithSkeleton";

const URL_REAL =
  "https://firebasestorage.googleapis.com/v0/b/test/o/receta.mp4?alt=media";

function renderVideo(props: Record<string, unknown> = {}) {
  const { container } = render(
    <VideoWithSkeleton src={URL_REAL} preload="metadata" {...props} />,
  );

  return container.querySelector("video") as HTMLVideoElement;
}

describe("VideoWithSkeleton", () => {
  /* El `<video>` de HTML no trae esto resuelto: sin `poster` —y aqui no se generan— lo que se ve
     hasta que llegan los metadatos es una caja vacia. */
  it("late mientras no llegan los metadatos", () => {
    renderVideo();

    expect(screen.getByTestId("media-skeleton")).toBeInTheDocument();
  });

  /* `loadedmetadata` y no `loadeddata`: con `preload="metadata"` el navegador se compromete a lo
     primero, y lo segundo puede no llegar nunca. */
  it("deja de latir cuando el navegador ya sabe qué vídeo es", () => {
    const video = renderVideo();

    fireEvent.loadedMetadata(video);

    expect(screen.queryByTestId("media-skeleton")).not.toBeInTheDocument();
  });

  it("tampoco se queda latiendo si el vídeo falla", () => {
    const video = renderVideo();

    fireEvent.error(video);

    expect(screen.queryByTestId("media-skeleton")).not.toBeInTheDocument();
  });

  it("no late por un vídeo cuyos metadatos ya estaban", () => {
    vi.spyOn(HTMLMediaElement.prototype, "readyState", "get").mockReturnValue(
      1,
    );

    renderVideo();

    expect(screen.queryByTestId("media-skeleton")).not.toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("sigue siendo el vídeo que le pidieron, con sus atributos", () => {
    const video = renderVideo({ controls: true, muted: true });

    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).toHaveAttribute("src", URL_REAL);
  });
});
