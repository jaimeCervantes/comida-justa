import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import EditPostForm from "./EditPostForm";

const noop = vi.fn();

const EVENT_POST = {
  slug: "rodada-cafetera",
  title: "Rodada cafetera",
  content: "Salida comunitaria",
  contactPhone: "2781092116",
  price: null,
  kind: "evento",
  origin: null,
  category: null,
  subCategory: null,
  startsAt: "2027-08-23T13:30:00.000Z",
  endsAt: "2027-08-23T15:00:00.000Z",
  durationMinutes: null,
  media: [
    {
      url: "https://example.com/rodada.jpg",
      type: "image",
      alt: "Rodada cafetera",
      width: 1200,
      height: 800,
    },
  ],
};

const PRODUCT_POST = {
  ...EVENT_POST,
  slug: "jugo-verde",
  title: "Jugo verde",
  kind: "producto",
  origin: "productor",
  price: 40,
  startsAt: null,
  endsAt: null,
};

const SERVICE_POST = {
  ...EVENT_POST,
  slug: "consulta-nutricional",
  title: "Consulta nutricional",
  kind: "servicio",
  price: 500,
  startsAt: null,
  endsAt: null,
  durationMinutes: 45,
};

const ANNOUNCEMENT_POST = {
  ...EVENT_POST,
  slug: "aviso-comunidad",
  title: "Aviso comunidad",
  kind: "anuncio",
  price: null,
  startsAt: null,
  endsAt: null,
};

function renderForm(post: typeof EVENT_POST): void {
  renderWithIntl(
    <EditPostForm
      action={noop}
      post={post}
      categoryOptions={[]}
      subCategoryOptionsByCategory={{}}
    />,
  );
}

describe("EditPostForm — fechas de evento", () => {
  it("muestra el instante guardado como hora local de la comunidad", () => {
    renderForm(EVENT_POST);

    expect(screen.getByLabelText(/cuándo empieza/i)).toHaveValue(
      "2027-08-23T07:30",
    );
    expect(screen.getByLabelText(/cuándo termina/i)).toHaveValue(
      "2027-08-23T09:00",
    );
  });
});

describe("EditPostForm — campos por tipo", () => {
  it("todos los tipos editan el telefono de contacto", () => {
    renderForm(SERVICE_POST);

    expect(screen.getByLabelText(/tel[eé]fono/i)).toHaveValue("2781092116");
    expect(screen.getByLabelText(/tel[eé]fono/i)).toBeRequired();
  });

  it("un anuncio no edita precio, procedencia, fecha ni duración", () => {
    renderForm(ANNOUNCEMENT_POST);

    expect(screen.queryByLabelText(/^precio/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /de dónde viene/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cuándo empieza/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cuánto dura/i)).not.toBeInTheDocument();
  });

  it("un producto exige precio y procedencia", () => {
    renderForm(PRODUCT_POST);

    expect(screen.getByLabelText(/^precio/i)).toBeRequired();
    expect(
      screen.getByRole("combobox", { name: /de dónde viene/i }),
    ).toBeRequired();
    expect(screen.queryByLabelText(/cuánto dura/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cuándo empieza/i)).not.toBeInTheDocument();
  });

  it("un evento exige inicio, pero deja el precio opcional", () => {
    renderForm(EVENT_POST);

    expect(screen.getByLabelText(/cuándo empieza/i)).toBeRequired();
    expect(screen.getByLabelText(/cuándo termina/i)).not.toBeRequired();
    expect(screen.getByLabelText(/^precio/i)).not.toBeRequired();
    expect(screen.queryByLabelText(/cuánto dura/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /de dónde viene/i }),
    ).not.toBeInTheDocument();
  });

  it("un servicio exige duración y precio, sin procedencia ni fechas", () => {
    renderForm(SERVICE_POST);

    expect(screen.getByLabelText(/cuánto dura/i)).toBeRequired();
    expect(screen.getByLabelText(/^precio/i)).toBeRequired();
    expect(screen.getByLabelText(/cuánto dura/i)).toHaveValue(45);
    expect(screen.getByLabelText(/^precio/i)).toHaveValue(500);
    expect(screen.queryByLabelText(/cuándo empieza/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /de dónde viene/i }),
    ).not.toBeInTheDocument();
  });
});
