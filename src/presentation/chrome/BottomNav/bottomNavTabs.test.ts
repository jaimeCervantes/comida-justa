import { describe, expect, it } from "vitest";
import {
  activeBottomNavTab,
  BOTTOM_NAV_TABS,
  type BottomNavTabId,
} from "./bottomNavTabs";

/**
 * Igual que `activeMenuSection`, se prueba contra la **plantilla interna** que devuelve
 * `usePathname` de `~/i18n/navigation`: `/pedido/[id]` para `/pedido/abc` y para `/en/order/abc`.
 * La regla se escribe una vez y vale en los dos idiomas.
 */
describe("la pestaña activa de la barra inferior", () => {
  it.each<[string, BottomNavTabId]>([
    ["/", "home"],
    ["/page/[page]", "home"],
    ["/buscar", "search"],
    ["/publicar", "publish"],
    ["/pedidos", "orders"],
    ["/pedido/[id]", "orders"],
    ["/cuenta", "account"],
    ["/cuenta/agenda", "account"],
  ])("marca %s como %s", (pathname, esperada) => {
    expect(activeBottomNavTab(pathname)).toBe(esperada);
  });

  /*
   * Una ficha se abre desde cualquier parte: decir «estás en Inicio» mientras alguien mira un
   * producto sería mentir sobre dónde está. `null` es la respuesta correcta.
   */
  it.each([
    ["/[slug]", "una publicación, a la que se llega desde cualquier parte"],
    ["/productos", "el catálogo vive en el menú, no en la barra"],
    ["/carrito", "el carrito está en el header"],
    ["/tienda/[slug]", "una tienda"],
    ["/nosotros", "una página de contenido"],
  ])("no marca nada en %s: %s", (pathname) => {
    expect(activeBottomNavTab(pathname)).toBeNull();
  });

  it("son cinco, como en el 5.1, y no se repiten", () => {
    const ids = BOTTOM_NAV_TABS.map((tab) => tab.id);

    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  /* Toda pestaña tiene que poder marcarse: una que no se marca nunca es una que miente siempre. */
  it("cada pestaña reconoce su propio destino", () => {
    for (const tab of BOTTOM_NAV_TABS) {
      expect(tab.pathnames.length).toBeGreaterThan(0);
      for (const pathname of tab.pathnames) {
        expect(activeBottomNavTab(pathname)).toBe(tab.id);
      }
    }
  });
});
