import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useSearchShortcut, useShortcutHint } from "./useSearchShortcut";

function Campo({ hidden = false }: { hidden?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  useSearchShortcut(ref);

  return (
    <div style={hidden ? { display: "none" } : undefined}>
      <input ref={ref} data-testid="campo" defaultValue="miel" />
    </div>
  );
}

function Pista() {
  return <span data-testid="pista">{useShortcutHint() ?? "—"}</span>;
}

describe("el atajo del buscador", () => {
  it("enfoca el campo y selecciona lo que hubiera", async () => {
    render(<Campo />);
    const campo = screen.getByTestId("campo") as HTMLInputElement;
    /* jsdom no calcula `offsetParent`; se declara visible, que es el caso que se prueba. */
    Object.defineProperty(campo, "offsetParent", { value: document.body });

    await userEvent.keyboard("{Control>}k{/Control}");

    expect(campo).toHaveFocus();
    // Quien pulsa el atajo viene a buscar otra cosa, no a añadirle letras a lo anterior.
    expect(campo.selectionStart).toBe(0);
    expect(campo.selectionEnd).toBe("miel".length);
  });

  /*
   * El header pinta dos buscadores —escritorio y teléfono— y esconde el que no toca. Sin esta
   * comprobación el atajo enfocaría un campo con `display: none`, que es enfocar nada.
   */
  it("ignora el campo que no se está viendo", async () => {
    render(<Campo hidden />);
    const campo = screen.getByTestId("campo");
    Object.defineProperty(campo, "offsetParent", { value: null });

    await userEvent.keyboard("{Control>}k{/Control}");

    expect(campo).not.toHaveFocus();
  });

  it.each([
    ["Mac", "Macintosh; Intel Mac OS X 10_15", "⌘K"],
    ["Windows", "Windows NT 10.0; Win64; x64", "Ctrl K"],
    ["iPhone", "iPhone; CPU iPhone OS 17_0 like Mac OS X", "⌘K"],
  ])("nombra la tecla de este teclado: %s", async (_caso, ua, esperado) => {
    vi.stubGlobal("navigator", { ...navigator, userAgent: ua, platform: "" });

    render(<Pista />);

    expect(await screen.findByText(esperado)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
