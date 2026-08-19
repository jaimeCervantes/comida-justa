# Fusion de Pilares y Habitos

Roadmap para reunir explicacion y practica bajo `/pilares`, reducir cambios de contexto y conservar
la profundidad editorial y la experiencia interactiva ya construidas. La especificacion de
comportamiento vive en `src/e2e/pilares/fusion-pilares-habitos.feature` y la bitacora por slice en
`docs/features/wellbeing/006-2026-08-12-fusion-pilares-habitos-bitacora.md`.

## Alineacion

- **Problem:** la persona entiende cada pilar en una ruta, pero debe abrir otra familia de rutas para
  ponerlo en practica. `/habitos` tampoco forma parte de la navegacion principal, por lo que la
  continuidad depende de enlaces puntuales.
- **Savings:** se elimina un clic y un cambio de contexto entre informacion y accion, se reduce la
  frustracion de descubrir dos arquitecturas para el mismo tema y se simplifica la navegacion.
- **Why:** Hazlo Sano busca convertir conocimiento en practica. Reunir ambos en el mismo recorrido
  acerca la accion al momento en que la persona entiende por que vale la pena intentarla.

## Modelo acordado

- `/pilares` sigue siendo el indice de las cuatro areas.
- Cada `/pilares/<pilar>` combina el articulo y su practica en un solo documento.
- La composicion intercala informacion y accion en vertical. Las dos columnas se reservan para
  bloques breves; el seguimiento usa todo el ancho para conservar legibilidad y respuesta movil.
- La identidad visual moderna de las experiencias de `/habitos` se integra sin duplicar `<main>`,
  heroes ni encabezados principales.
- Las rutas `/habitos` se eliminan, no se redirigen. Este contenido aun no fue publicado en
  produccion y no existe compatibilidad externa que conservar.
- Las claves de retos, progreso, puntos, privacidad y datos persistidos no cambian. La fusion es de
  arquitectura de informacion, rutas y presentacion.
- Las pruebas E2E se mantienen como especificacion ejecutable, pero no se ejecutan durante los
  slices. El usuario las ejecutara manualmente cuando termine el roadmap completo.

## Roadmap

### Slice 1 - Sueño como piloto vertical

**Alcance**

- Integrar en `/pilares/sueno` el hero, las anclas noche/manana, el seguimiento, el ritual y las
  celebraciones de `Del atardecer al amanecer`.
- Intercalar una invitacion accionable despues del contexto inicial y antes de la evidencia extensa
  y las referencias.
- Reutilizar los componentes de seguimiento existentes; no copiar la pagina completa de Habitos.
- Cambiar a `/pilares/sueno` los destinos publicos, el retorno de autenticacion y las rutas de
  revalidacion relacionadas con Sueno.
- Eliminar la pagina `/habitos/sueno` y su metadata. `/habitos/sueno` y `/en/habits/sleep` dejan de
  resolver y no redirigen.
- Retirar las URL de Sueno bajo `/habitos` del sitemap y de cualquier superficie de descubrimiento.

**Criterios de aceptacion**

- `/pilares/sueno` y `/en/pillars/sueno` muestran explicacion y practica sin navegar a otra pagina.
- El documento tiene una sola jerarquia principal y la practica aparece antes de `Referencias`.
- El panel conserva inicio, registro, puntos, celebraciones, privacidad y jardin comunitario.
- Una persona sin sesion vuelve a `/pilares/sueno` despues de autenticarse.
- Las celebraciones publicas y el mensaje global enlazan a `/pilares/sueno`.
- `/habitos/sueno` y `/en/habits/sleep` no existen y no responden con redireccion.
- La experiencia funciona en una columna movil y usa dos columnas solo para contenido breve.

### Slice 2 - Alimentacion, Movimiento y Mente/Espiritu

**Alcance**

- Aplicar el patron validado a los otros tres detalles de `/pilares`.
- Extraer solo las piezas compartidas que el piloto demuestre necesarias.
- Actualizar enlaces publicos, retornos de autenticacion, revalidaciones y metadata.
- Eliminar las paginas dinamicas bajo `/habitos/<slug>` y sus URL es/en.

**Criterios de aceptacion**

- Cada detalle combina informacion y practica con la identidad visual de su pilar.
- Las cuatro practicas conservan sus reglas, progreso y celebraciones.
- Ninguna superficie interna enlaza a un detalle bajo `/habitos`.
- Las antiguas URL de los cuatro detalles no existen ni redirigen.

### Slice 3 - Consolidar los indices

**Alcance**

- Integrar en `/pilares` los estados de las practicas iniciadas, las invitaciones y la liga que hoy
  viven en `/habitos`.
- Evitar dos cuadriculas equivalentes: cada pilar presenta en una misma tarjeta su proposito y su
  practica asociada.
- Mover las acciones de liga al area de Pilares y eliminar la pagina `/habitos`.
- Limpiar routing localizado, sitemap, metadata, `llms.txt`, pruebas y referencias internas que aun
  conozcan la familia `/habitos`.

**Criterios de aceptacion**

- `/pilares` permite descubrir los cuatro temas, ver las practicas iniciadas y consultar la liga.
- No existe ninguna pagina publica bajo `/habitos` en español ni en ingles.
- Sitemap, canonical, alternates y enlaces internos solo publican la familia `/pilares`.
- La navegacion completa funciona en escritorio y movil sin duplicar contenido ni controles.

## Validacion

En cada slice se ejecutan:

- `pnpm run test:run`
- `pnpm run typecheck`
- `pnpm run lint`

Al final del roadmap, el usuario ejecutara manualmente:

- `pnpm run test:e2e:run`
