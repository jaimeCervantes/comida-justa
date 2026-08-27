import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AccountNav from "./AccountNav";

describe("AccountNav", () => {
  it("Mi cuenta, Mis pedidos y Mis hábitos se ofrecen siempre", () => {
    renderWithIntl(<AccountNav username={null} hasStore={false} />);

    expect(
      screen.getByRole("link", { name: es.nav.myAccount, exact: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: es.nav.myOrders }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: es.nav.myHabits }),
    ).toBeInTheDocument();
  });

  it("«Mi cuenta» es la única entrada activa: solo /cuenta monta este menú hoy", () => {
    renderWithIntl(<AccountNav username={null} hasStore={false} />);

    expect(
      screen.getByRole("link", { name: es.nav.myAccount, exact: true }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("sin tienda, no ofrece agenda", () => {
    renderWithIntl(<AccountNav username={null} hasStore={false} />);

    expect(
      screen.queryByRole("link", { name: es.nav.schedule }),
    ).not.toBeInTheDocument();
  });

  it("con tienda, ofrece agenda", () => {
    renderWithIntl(<AccountNav username={null} hasStore={true} />);

    expect(
      screen.getByRole("link", { name: es.nav.schedule }),
    ).toBeInTheDocument();
  });

  it("sin dirección personal reclamada, no ofrece Mis publicaciones", () => {
    renderWithIntl(<AccountNav username={null} hasStore={true} />);

    expect(
      screen.queryByRole("link", { name: es.nav.myPublications }),
    ).not.toBeInTheDocument();
  });

  it("con dirección personal, Mis publicaciones lleva al perfil público", () => {
    renderWithIntl(<AccountNav username="jaime" hasStore={true} />);

    expect(
      screen.getByRole("link", { name: es.nav.myPublications }),
    ).toHaveAttribute("href", "/u/jaime");
  });
});
