import { readFileSync } from "node:fs";
import { join } from "node:path";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { POST_TITLE_MAX_LENGTH, SITE_CURRENCY } from "~/infra/constants";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PublishForm from "./PublishForm";
import { openStepOf } from "./publishFormHarness";

const noop = vi.fn();

const renderForm = () =>
  renderWithIntl(
    <PublishForm
      action={noop}
      categoryOptions={[]}
      subCategoryOptionsByCategory={{}}
    />,
  );

const titleField = () =>
  screen.getByRole("textbox", { name: /t[ií]tulo de la publicación/i });

/**
 * El contador, buscado por su forma «n/tope» y no por su texto exacto.
 *
 * El rótulo antepone un separador —« · »— que es decisión del design system, no de esta pantalla:
 * comparar la cadena completa ataría la prueba a ese separador. La forma es lo que promete.
 */
const counter = () =>
  screen.getByText(new RegExp(String.raw`\d+\s*/\s*${POST_TITLE_MAX_LENGTH}`));

/**
 * El contador de caracteres del título, que es el 5.3 del canvas.
 *
 * Se prueba **el número**, no dónde está pintado: lo que promete la pantalla es «sabes cuánto llevas
 * y cuánto cabe», y el sitio del rótulo es una decisión de maquetación que puede cambiar sin que la
 * promesa cambie.
 */
describe("PublishForm — el contador del título", () => {
  it("cuenta lo escrito contra el tope", async () => {
    renderForm();
    const title = "Miel cruda de azahar";

    await userEvent.type(titleField(), title);

    expect(counter()).toHaveTextContent(
      `${title.length}/${POST_TITLE_MAX_LENGTH}`,
    );
  });

  it("empieza en cero, sin dar por escrito lo que no está", () => {
    renderForm();

    expect(counter()).toHaveTextContent(`0/${POST_TITLE_MAX_LENGTH}`);
  });

  /**
   * El tope se impone en el campo y no solo se anuncia. Un contador que pasa de 70 sin impedir nada
   * es un adorno: el título acabaría cortado con puntos suspensivos en la tarjeta del listado, que
   * es justo lo que el tope viene a evitar.
   */
  it("no deja pasar del tope", () => {
    renderForm();

    expect(titleField()).toHaveAttribute(
      "maxlength",
      String(POST_TITLE_MAX_LENGTH),
    );
  });
});

describe("PublishForm — la moneda del precio", () => {
  it("dice en qué moneda está el número", async () => {
    renderForm();
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: /tipo de publicación/i }),
      "producto",
    );
    await openStepOf("price");

    expect(screen.getByText(SITE_CURRENCY)).toBeInTheDocument();
  });
});

/**
 * El mismo tope en las dos pantallas.
 *
 * Un límite que solo existe al publicar no es un límite: se esquiva editando, y entonces la tarjeta
 * del listado vuelve a cortar títulos. Se lee el fuente de `/editar` porque probarlo allí exigiría
 * montar una publicación entera para comprobar un atributo.
 */
describe("El tope del título", () => {
  const editForm = readFileSync(
    join(__dirname, "..", "editar", "[slug]", "ui", "EditPostForm.tsx"),
    "utf8",
  );

  it("también se aplica al editar", () => {
    expect(editForm).toContain("maxLength={POST_TITLE_MAX_LENGTH}");
  });

  it("no se escribe a mano en ninguna de las dos", () => {
    const publishForm = readFileSync(
      join(__dirname, "PublishForm.tsx"),
      "utf8",
    );

    expect(publishForm).toContain("maxLength={POST_TITLE_MAX_LENGTH}");
    expect(publishForm).not.toContain(`maxLength={${POST_TITLE_MAX_LENGTH}}`);
  });
});
