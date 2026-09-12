import { expect, type Locator } from "@playwright/test";

/**
 * Abre un desplegable **esperando a que React esté enganchado**.
 *
 * Hermano de `selectWhenHydrated`, y el mismo problema de fondo: el disparador llega del servidor
 * como HTML normal —con su `aria-expanded="false"` y todo—, así que Playwright lo ve visible,
 * estable y habilitado, y lo pulsa. Pero hasta que la hidratación no engancha el manejador, esa
 * pulsación no abre nada y no falla nada: el panel simplemente no aparece, y lo que revienta es la
 * línea siguiente, buscando algo dentro de un menú que nunca se abrió.
 *
 * En un listado la ventana es más ancha de lo que parece: las tarjetas del feed se reparten en
 * columnas midiendo en el cliente, así que el trabajo de hidratación no termina cuando la página
 * responde.
 *
 * `toPass` reintenta la pareja completa —pulsar y comprobar que abrió—, que es lo que convierte una
 * carrera en una espera. Se mira `aria-expanded` antes de pulsar para no cerrar lo que ya está
 * abierto: sin eso, el reintento haría de interruptor y el menú parpadearía sin converger.
 *
 * No se hace con un `waitForTimeout`: dormir medio segundo funciona hasta el día que la máquina va
 * lenta, y entonces vuelve como intermitencia.
 */

/**
 * Cuánto se aparta el disparador de la cabecera antes de pulsarlo.
 *
 * La cabecera del sitio es `sticky top-0 z-50`. Playwright desplaza lo que va a pulsar hasta
 * dejarlo a la vista, y "a la vista" puede ser justo debajo de ella: entonces la cabecera se come
 * la pulsación, Playwright reintenta en silencio y lo que falla, noventa segundos después, es el
 * escenario entero sin decir por qué. Un empujón hacia arriba deja el control en sitio despejado.
 *
 * 160 px es la cabecera (64) más la barra de cercanía y su aire, con margen.
 */
const HEADER_CLEARANCE = 160;
export async function openWhenHydrated(
  trigger: Locator,
  panel: Locator,
): Promise<void> {
  await expect(async () => {
    /* Todo con plazo propio. `toPass` reintenta, pero no interrumpe: una llamada de dentro que
       se cuelgue —un `click` sobre algo que nunca llega a ser pulsable— se lleva por delante el
       escenario entero y el error que sale apunta aquí sin decir qué esperaba. */
    const expanded = await trigger.getAttribute("aria-expanded", {
      timeout: 2_000,
    });

    if (expanded !== "true") {
      await trigger.scrollIntoViewIfNeeded({ timeout: 2_000 });
      await trigger.page().mouse.wheel(0, -HEADER_CLEARANCE);
      await trigger.click({ timeout: 3_000 });
    }
    /* Un plazo corto **dentro** del reintento, y el largo fuera: con el de por omisión (5 s) cada
       vuelta se quedaba esperando a un panel que esa pulsación nunca iba a abrir, y el presupuesto
       entero se gastaba en tres intentos. Lo que hay que reintentar es la pulsación, no la espera. */
    await expect(panel).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
}
