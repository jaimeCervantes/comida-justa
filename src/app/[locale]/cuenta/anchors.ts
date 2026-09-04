/**
 * Los anclas de los bloques de «Mi cuenta».
 *
 * Existen porque la lista de pendientes enlaza a **dentro de esta misma página**: sin un ancla, el
 * enlace de «Sube el logo de tu tienda» deja a la persona arriba del todo, mirando la misma lista
 * que acaba de pulsar. Con ella, la ficha queda a la vista.
 *
 * Viven en un módulo aparte y no como cadenas sueltas porque el ancla es un **contrato entre dos
 * archivos**: el que enlaza (`SetupChecklist`) y el que se deja enlazar (`page.tsx`). Escrita dos
 * veces, se rompe la primera vez que alguien renombra una y no la otra, y el fallo es silencioso —el
 * enlace sigue funcionando, solo que no lleva a ningún sitio—.
 *
 * En español aunque el código esté en inglés: un ancla es parte de la dirección, y la dirección es
 * lo que la persona ve en la barra del navegador.
 */
export const ANCHOR = {
  store: "abrir-tienda",
  username: "direccion-personal",
  storeProfile: "ficha-de-tu-tienda",
  branches: "tus-sucursales",
  addBranch: "agregar-sucursal",
} as const;
