import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AppLocale } from "~/i18n/routing";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import PublishForm from "./PublishForm";
import { chooseKind, openStepOf } from "./publishFormHarness";

const noop = vi.fn();

afterEach(cleanup);

function renderForm(locale: AppLocale = "es", action = noop) {
  return renderWithIntl(
    <PublishForm
      action={action}
      categoryOptions={[]}
      subCategoryOptionsByCategory={{}}
    />,
    { locale },
  );
}

/** Escribe (si hay qué) y sale del campo: es el `blur` lo que lo marca como tocado. */
async function fillAndLeave(field: HTMLElement, value: string): Promise<void> {
  await userEvent.click(field);
  if (value) await userEvent.type(field, value);
  await userEvent.tab();
}

/**
 * El desk check del `Scenario Outline` de `validacionFormularios.feature`.
 *
 * La propiedad que se comprueba no es sólo que salga una frase en rojo: es que sea **la misma** que
 * contestaría la Server Action para esa regla. Cliente y servidor leen la misma clave del catálogo,
 * así que un campo no puede decir una cosa antes de enviar y otra después.
 */
describe("PublishForm — cada campo dice su razón, y es la del servidor", () => {
  it.each([
    ["title", /título de la publicación/i, "", "El título es obligatorio."],
    [
      "content",
      /descripción del producto/i,
      "",
      "El contenido es obligatorio.",
    ],
    ["phone", /teléfono/i, "", "El teléfono es obligatorio."],
  ])("%s vacío", async (field, label, value, message) => {
    renderForm();
    await openStepOf(field);

    await fillAndLeave(screen.getByRole("textbox", { name: label }), value);

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it.each([
    ["278-109-2116", "guiones"],
    ["278109211", "nueve dígitos"],
  ])(
    "el teléfono con %s explica el formato en vez de decir «coincide con el solicitado»",
    async (value) => {
      renderForm();
      await openStepOf("phone");

      await fillAndLeave(
        screen.getByRole("textbox", { name: /teléfono/i }),
        value,
      );

      expect(
        screen.getByText(
          "Escribe 10 dígitos, o +52 y 10 dígitos. Ej: 2781092116",
        ),
      ).toBeInTheDocument();
    },
  );

  it("un precio de 0 en un producto se explica por el mínimo", async () => {
    renderForm();
    await chooseKind("producto");
    await openStepOf("price");

    await fillAndLeave(
      screen.getByRole("spinbutton", { name: /precio/i }),
      "0",
    );

    expect(
      screen.getByText("El precio debe ser mayor a cero."),
    ).toBeInTheDocument();
  });

  it.each([
    ["", "Un servicio necesita decir cuánto dura, en minutos."],
    ["3", "La duración mínima es de 5 minutos."],
    ["7", "Escribe la duración en múltiplos de 5 minutos."],
  ])("la duración «%s» de un servicio", async (value, message) => {
    renderForm();
    await chooseKind("servicio");
    await openStepOf("durationMinutes");

    await fillAndLeave(
      screen.getByRole("spinbutton", { name: /cuánto dura/i }),
      value,
    );

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("un evento sin fecha dice que la fecha es lo que lo hace evento", async () => {
    renderForm();
    await chooseKind("evento");
    await openStepOf("startsAt");

    await fillAndLeave(screen.getByLabelText(/cuándo empieza/i), "");

    expect(
      screen.getByText("Un evento necesita decir cuándo ocurre."),
    ).toBeInTheDocument();
  });
});

/**
 * La razón de ser del slice. El globito nativo lo pinta el navegador con SU idioma de interfaz, que
 * no tiene por qué ser el de la ruta: en `/en/publish` con un Chrome en español decía «Completa
 * este campo». Aquí la ruta manda.
 */
describe("PublishForm — el mensaje habla el idioma de la ruta", () => {
  it("contesta en español en la ruta española", async () => {
    renderForm("es");

    await fillAndLeave(
      screen.getByRole("textbox", { name: /título de la publicación/i }),
      "",
    );

    expect(screen.getByText("El título es obligatorio.")).toBeInTheDocument();
  });

  it("contesta en inglés en la ruta inglesa", async () => {
    renderForm("en");

    await fillAndLeave(
      screen.getByRole("textbox", { name: /publication title/i }),
      "",
    );

    expect(screen.getByText("The title is required.")).toBeInTheDocument();
  });
});

describe("PublishForm — enviar con errores", () => {
  /* Publicar vive en el último paso del asistente: se llega ahí y se envía sin rellenar nada. */
  it("no molesta al servidor y enfoca el primer campo inválido", async () => {
    renderForm();
    await openStepOf("phone");

    await userEvent.click(screen.getByRole("button", { name: /^publicar$/i }));

    expect(noop).not.toHaveBeenCalled();
    /* El título vive en el primer paso, así que el foco salta hasta él: es lo que `Form` hace y
       lo que evita que alguien se quede mirando una pantalla sin nada marcado. */
    await openStepOf("title");
    expect(
      screen.getByRole("textbox", { name: /título de la publicación/i }),
    ).toBeInTheDocument();
  });

  it("enseña de golpe todo lo que falta, no de uno en uno", async () => {
    renderForm();
    await openStepOf("phone");

    await userEvent.click(screen.getByRole("button", { name: /^publicar$/i }));

    expect(screen.getByText("El título es obligatorio.")).toBeInTheDocument();
    expect(screen.getByText("El teléfono es obligatorio.")).toBeInTheDocument();
    expect(
      screen.getByText("El contenido es obligatorio."),
    ).toBeInTheDocument();
  });

  it("pinta el error de media junto al selector cuando el servidor rechaza el envío", async () => {
    const action = vi.fn(async () => ({
      errors: {
        media: "Sube al menos una imagen o un video.",
      },
      success: false,
      id: null,
      slug: null,
    }));
    renderForm("es", action);

    await userEvent.type(
      screen.getByRole("textbox", { name: /título de la publicación/i }),
      "Reto caminata 5 minutos",
    );

    /* El teléfono y la descripción viven en el último paso del asistente; el título, en el
       primero. Rellenar los tres es cruzarlo entero, que es lo que hace quien publica. */
    await openStepOf("phone");
    await userEvent.type(
      screen.getByRole("textbox", { name: /teléfono/i }),
      "2781092116",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /descripción del producto/i }),
      "Empieza con cinco minutos al día, sin equipo y cerca de casa.",
    );
    await userEvent.click(screen.getByRole("button", { name: /^publicar$/i }));

    expect(action).toHaveBeenCalled();
    expect(
      await screen.findByText("Sube al menos una imagen o un video."),
    ).toBeInTheDocument();
  });
});
