import { describe, expect, it } from "vitest";
import { renderWithIntl as render } from "~/infra/test-utils/renderWithIntl";
import MediaContent from "./MediaContent";

describe("When a publication has no usable media", () => {
  // El defecto que documenta `docs/pendientes.md`: el listado respondía 500 porque
  // `DefaultContent` leía `media.url` sobre un `undefined`.
  it.each([
    ["undefined", undefined],
    ["sin url", { url: "", type: "image", alt: "" }],
  ])("degrada a un marcador en vez de reventar (%s)", (_name, media) => {
    const { getByTestId } = render(<MediaContent media={media} />);

    expect(getByTestId("media-placeholder")).toHaveTextContent(
      "Publicación sin imagen",
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
