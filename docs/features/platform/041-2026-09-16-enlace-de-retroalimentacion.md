# Un enlace de retroalimentación por WhatsApp, en todo el sitio

## Contexto

- **Problema:** no hay dónde proponer una idea o reportar un error sin salir del flujo del sitio o
  buscar el WhatsApp de la comunidad de memoria.
- **Ahorro:** reutiliza el WhatsApp que ya existe, con un mensaje ya escrito, así que cuesta un clic
  y no una búsqueda ni escribir el mensaje desde cero.
- **Por qué:** cuantas más ideas y errores lleguen, mejor decide el equipo qué construir después.

## Decisiones (confirmadas con el usuario)

- **Mismo número de siempre** (`2781126948`, el mismo que ya usa el pie), no uno dedicado — con un
  mensaje ya escrito para que se note que es ese tipo de contacto y no un pedido.
- **Texto: "¿Qué te hace falta?"** — pregunta abierta que cubre queja, idea y error sin sonar
  negativa ni limitarse a una sola cosa.
- **Tres lugares, cada uno con la forma que le toca:**
  - **Header de escritorio:** icono junto al carrito (mismo patrón visual que `CartLink`).
  - **Teléfono:** fila de texto dentro del menú de hamburguesa, no un sexto icono en la barra
    inferior — esa ya tiene sus cinco lugares fijos (inicio, buscar, publicar, catálogo, cuenta) y
    quitarle uno o agregarle un sexto no se planteó.
  - **Pie:** una línea nueva junto al WhatsApp de contacto que ya existía, con su propio texto para
    no confundir "escríbenos para comprar" con "dinos qué falta".

## Alcance

- `src/infra/constants/index.ts`: `HAZLO_SANO_WHATSAPP_PHONE`, para dejar de repetir el número a
  mano en cada archivo que lo necesite.
- `src/presentation/chrome/Header/Header.tsx`: icono de escritorio (`hidden lg:block`, junto a
  `CartLink`) y fila dentro de los `children` de `MobileNav`.
- `src/presentation/chrome/Footer/Footer.tsx`: nueva entrada en la lista de contacto; `ExternalLink`
  ganó un `data-testid` opcional para poder afirmarlo.
- Catálogo de mensajes (`common.feedbackLabel`, `common.feedbackWhatsappMessage`,
  `footer.feedback`) en `es.json` y `en.json`.

## Cobertura

- `src/e2e/chrome/feedbackLink.feature` + `.spec.ts`: el icono en escritorio (junto al carrito, con
  su nombre accesible y su `href`), la fila en el menú del teléfono (y que la barra inferior sigue
  con sus cinco lugares), y el enlace del pie (distinto del WhatsApp de contacto de siempre).
- `Footer.test.tsx`: el enlace nuevo lleva el número y el mensaje correctos.

## Criterios de aceptación

1. En escritorio, el icono de retroalimentación está visible junto al carrito y su enlace abre
   WhatsApp con el mensaje ya escrito.
2. En el teléfono, la fila "¿Qué te hace falta?" está en el menú de hamburguesa y la barra inferior
   conserva sus cinco lugares de siempre.
3. El pie muestra el nuevo enlace sin reemplazar el WhatsApp de contacto que ya existía.
4. Ninguno de los tres enlaces nombra un número distinto al que ya usa la comunidad.
