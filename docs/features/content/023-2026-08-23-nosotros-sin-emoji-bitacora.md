# Bitácora — Fuera los emoji como sistema

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.11 · /nosotros**.

---

## Slice 1 — Insignias y viñetas en vez de dibujos (2026-08-23)

### Qué había

**25 claves de texto con emoji** en `about`, más cuatro en el componente. No era decoración suelta:
los emoji **hacían de sistema**.

- La `✅` era el **único** indicador de lista de toda la página — y una palomita dice «hecho» donde
  aquí solo se enumeran cuatro pilares.
- El bloque del cacahuate llevaba **tres distintos** —`✅`, `💪`, `🌿`— para tres cualidades del
  mismo rango, lo que las hace leer como categorías diferentes.
- Y cada plataforma los dibuja a su manera, así que ni siquiera son el mismo símbolo para todos.

### Qué hay ahora

Los pilares se enumeran con la **insignia del sistema**, con su número y su color: es lo único que
distingue Movimiento de Mente para quien no separa sus verdes, y es la misma pieza que ya usan la
tarjeta del listado y el pie. Las cualidades llevan **una sola viñeta**, en la tinta de la marca.

Lo que sustituye a los demás emoji **no es nada**. Un rótulo no necesita un dibujo delante para ser
un rótulo.

### La prueba mira los textos, no el componente

Es por donde volverían. En el JSX se verían al revisar; en un JSON de mensajes pasan desapercibidos
—de hecho llevaban 25 claves ahí—. La guarda recorre `about` en los dos idiomas y, en el componente,
mira solo el JSX: los tres emoji que quedan en el archivo están dentro de comentarios, contando lo
que se quitó, y prohibirlos ahí sería prohibir explicar la decisión.

La e2e comprueba lo **pintado**, que es lo único que caza un emoji que vuelva desde el catálogo.

### Dos cosas que salieron de paso

- **Un `<main>` dentro de otro `<main>`.** El layout ya pone el suyo; la página ponía otro. Es HTML
  inválido y deja el documento con dos regiones principales — un lector de pantalla ofrece «saltar
  al contenido» dos veces. Lo destapó el escenario que lee el texto de la página, al resolver
  `locator("main")` a dos elementos.
- **`PILLAR_SHORT_KEYS` queda sin uso** y se retira. Su comentario decía «como los lista el pie», y
  el pie pasó a `PILLAR_ITEMS` en el slice del 5.16; ésta era su última consumidora.

### Lo que queda del 5.11

- **«Un acento por bloque»**: hoy conviven miel, arcilla y el azul del pilar de mente en la misma
  pantalla. Es un repintado con más superficie que este slice.
- **«La alianza se declara»**: el pan es de MM Naturalmente y el canvas lo pone con su nombre
  arriba. La página ya lo dice —`breadPartner`— pero en el cuerpo, no en la cabecera del bloque.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "…/nosotros"` · `"…/chrome"` | **3 + 74 en verde** |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (1002 archivos) |
| `pnpm exec playwright test src/e2e/about` | **7/7** |

### Recap

Los pilares se enumeran con la insignia que ya usa el resto del sitio y las listas con una viñeta de
marca. Los 25 emoji del catálogo se fueron, y una prueba mira ahí —no solo en el componente— porque
es por donde entraron.
