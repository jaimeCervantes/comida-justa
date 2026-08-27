import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import es from "~/i18n/messages/es.json";
import { renderWithIntl } from "~/infra/test-utils/renderWithIntl";
import { THEME_COOKIE } from "~/infra/theme/themeCookie";
import ThemeToggle from "./ThemeToggle";

function clearThemeCookie() {
  // biome-ignore lint/suspicious/noDocumentCookie: limpieza de la prueba, no código de producción.
  document.cookie = `${THEME_COOKIE}=; path=/; max-age=0`;
}

function readThemeCookie(): string | undefined {
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${THEME_COOKIE}=`))
    ?.split("=")[1];
}

describe("ThemeToggle", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    clearThemeCookie();
  });

  it("sin preferencia guardada, arranca en automático", () => {
    renderWithIntl(<ThemeToggle initial={null} />);

    expect(
      screen.getByRole("button", { name: es.footer.theme.switchTo.light }),
    ).toBeInTheDocument();
    expect(screen.getByText(es.footer.theme.label.system)).toBeInTheDocument();
  });

  it("arranca en el estado que trae el servidor, no siempre en automático", () => {
    renderWithIntl(<ThemeToggle initial="dark" />);

    expect(screen.getByText(es.footer.theme.label.dark)).toBeInTheDocument();
  });

  it("un clic rota automático → claro → oscuro → automático, y lo escribe en el DOM y la cookie", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ThemeToggle initial={null} />);
    const button = screen.getByRole("button");

    await user.click(button);
    expect(screen.getByText(es.footer.theme.label.light)).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(readThemeCookie()).toBe("light");

    await user.click(button);
    expect(screen.getByText(es.footer.theme.label.dark)).toBeInTheDocument();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(readThemeCookie()).toBe("dark");

    await user.click(button);
    expect(screen.getByText(es.footer.theme.label.system)).toBeInTheDocument();
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    /* Borrar la cookie es un `Set-Cookie` con `max-age=0`: jsdom la refleja quitándola del todo, no
       dejándola con un valor vacío. */
    expect(readThemeCookie()).toBeUndefined();
  });

  it("el nombre accesible describe a dónde lleva el clic, no dónde está", () => {
    renderWithIntl(<ThemeToggle initial="dark" />);

    /* En "oscuro", el siguiente paso del ciclo es "automático": el botón lo anuncia como destino,
       no repite el estado que el texto visible ya dice. */
    expect(
      screen.getByRole("button", { name: es.footer.theme.switchTo.system }),
    ).toBeInTheDocument();
  });
});
