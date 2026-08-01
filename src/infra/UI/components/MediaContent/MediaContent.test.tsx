import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MediaContent, { NO_MEDIA_MESSAGE } from "./MediaContent";

describe("When a publication has no usable media", () => {
  // El defecto que documenta `docs/pendientes.md`: el listado respondía 500 porque
  // `DefaultContent` leía `media.url` sobre un `undefined`.
  it.each([
    ["undefined", undefined],
    ["sin url", { url: "", type: "image", alt: "" }],
  ])("degrada a un marcador en vez de reventar (%s)", (_name, media) => {
    const { getByTestId } = render(<MediaContent media={media} />);

    expect(getByTestId("media-placeholder")).toHaveTextContent(
      NO_MEDIA_MESSAGE,
    );
  });
});

describe("When a publication has media", () => {
  it("pinta la imagen", () => {
    const { getByAltText } = render(
      <MediaContent
        media={{
          url: "https://firebasestorage.googleapis.com/v0/b/test/o/seed.jpg",
          type: "image",
          alt: "Jugo Verde",
        }}
      />,
    );

    expect(getByAltText("Jugo Verde")).toBeInTheDocument();
  });
});
