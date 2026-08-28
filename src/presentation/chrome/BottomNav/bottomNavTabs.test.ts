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
    ["/productos", "products"],
    ["/productos/page/[page]", "products"],
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
    ["/carrito", "el carrito está en el header"],
    ["/tienda/[slug]", "una tienda"],
    ["/nosotros", "una página de contenido"],
    /* «Pedidos» dejó la barra: se llega por el menú del avatar y por la pestaña «Yo»
       (`AccountNav`). Su plaza es ahora del catálogo — ver el porqué en `bottomNavTabs.ts`. */
    ["/pedidos", "los pedidos viven en la cuenta, no en la barra"],
    ["/pedido/[id]", "el detalle de un pedido, por lo mismo"],
  ])("no marca nada en %s: %s", (pathname) => {
    expect(activeBottomNavTab(pathname)).toBeNull();
  });

  /*
   * La razón de ser de esta pestaña: en un teléfono el catálogo estaba a un solo enlace visible, en
   * el pie, a 6.670 px de scroll. Si vuelve a salir de la barra, que sea una decisión y no un
   * descuido.
   */
  it("el catálogo tiene su plaza en la barra del pulgar", () => {
    const catalogo = BOTTOM_NAV_TABS.find((tab) => tab.id === "products");

    expect(catalogo?.href).toBe("/productos");
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
