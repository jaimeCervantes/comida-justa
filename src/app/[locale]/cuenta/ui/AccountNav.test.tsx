import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import AccountNav, { type AccountSectionKey } from "./AccountNav";

describe("AccountNav", () => {
  it("Mi cuenta, Mis pedidos y Mis hábitos se ofrecen siempre", () => {
    renderWithIntl(
      <AccountNav active="account" username={null} hasStore={false} />,
    );

    expect(
      screen.getByRole("link", { name: es.nav.myAccount }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: es.nav.myOrders }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: es.nav.myHabits }),
    ).toBeInTheDocument();
  });

  it.each<[AccountSectionKey, string]>([
    ["account", es.nav.myAccount],
    ["orders", es.nav.myOrders],
    ["schedule", es.nav.schedule],
    /* «Mis hábitos» era la única entrada que no podía marcarse: `/habitos` no montaba el menú, así
       que se llegaba desde la cuenta y se salía de ella sin saberlo. */
    ["habits", es.nav.myHabits],
  ])('con active="%s", esa es la única entrada marcada', (active, label) => {
    renderWithIntl(
      <AccountNav active={active} username={null} hasStore={true} />,
    );

    expect(screen.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen
        .getAllByRole("link")
        .filter((el) => el.hasAttribute("aria-current")),
    ).toHaveLength(1);
  });

  it("sin tienda, no ofrece agenda", () => {
    renderWithIntl(
      <AccountNav active="account" username={null} hasStore={false} />,
    );

    expect(
      screen.queryByRole("link", { name: es.nav.schedule }),
    ).not.toBeInTheDocument();
  });

  it("con tienda, ofrece agenda", () => {
    renderWithIntl(
      <AccountNav active="account" username={null} hasStore={true} />,
    );

    expect(
      screen.getByRole("link", { name: es.nav.schedule }),
    ).toBeInTheDocument();
  });

  it("sin dirección personal reclamada, no ofrece Mis publicaciones", () => {
    renderWithIntl(
      <AccountNav active="account" username={null} hasStore={true} />,
    );

    expect(
      screen.queryByRole("link", { name: es.nav.myPublications }),
    ).not.toBeInTheDocument();
  });

  it("con dirección personal, Mis publicaciones lleva al perfil público", () => {
    renderWithIntl(
      <AccountNav active="account" username="jaime" hasStore={true} />,
    );

    expect(
      screen.getByRole("link", { name: es.nav.myPublications }),
    ).toHaveAttribute("href", "/u/jaime");
  });
});
