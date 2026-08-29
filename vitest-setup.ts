import "@testing-library/jest-dom/vitest";

/**
 * `PointerEvent`, que jsdom no implementa.
 *
 * Sin esto, `fireEvent.pointerDown(nodo, { clientX: 40 })` construye un `Event` a secas —Testing
 * Library recurre a `window.Event` cuando el constructor del tipo no existe— y las coordenadas se
 * pierden por el camino: el oyente recibe el evento, pero `clientX` llega `undefined`. Cualquier
 * componente que decida algo a partir de dónde está el puntero queda entonces sin poder probarse
 * en jsdom, y lo peor es cómo falla: la prueba no revienta, simplemente no ocurre nada.
 *
 * Lo descubrió el arrastre de `PostMediaTray`, que desde el slice del tacto se conduce con eventos
 * de puntero para servir también con el dedo. Hereda de `MouseEvent` porque es de donde salen
 * `clientX`, `clientY` y `button`; lo que se añade son los tres campos que distinguen una entrada
 * de otra, que es justo lo que el componente pregunta para decidir si espera a que se sostenga.
 *
 * Es un apaño del entorno de pruebas, no del producto: en un navegador de verdad esta clase existe.
 * La prueba que comprueba que el gesto ocurre **en un navegador** vive en
 * `src/e2e/multimedia/arrastreTactil.spec.ts`.
 */
if (typeof window !== "undefined" && !("PointerEvent" in window)) {
  interface PointerEventInit extends MouseEventInit {
    pointerId?: number;
    pointerType?: string;
    isPrimary?: boolean;
  }

  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? "";
      this.isPrimary = init.isPrimary ?? true;
    }
  }

  Object.defineProperty(window, "PointerEvent", {
    value: PointerEventPolyfill,
    configurable: true,
    writable: true,
  });
}
