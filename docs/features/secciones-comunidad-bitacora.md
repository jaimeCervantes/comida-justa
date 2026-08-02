# Bitácora — Secciones de comunidad

Registro append-only. Narra el **por qué**; el qué está en `git log`.

---

## Slice 0 — Que el menú deje de mentir (2026-08-02)

### Objetivo

Las seis entradas de «Comunidad» llevaban a rutas que llaman a `notFound()`. Como viven en el
header, eran **seis 404 enlazados desde todas las páginas del sitio**: quien llega se topa con una
puerta cerrada, y quien rastrea gasta ahí su presupuesto y desconfía del resto. Ocultarlas es media
hora y recupera el enlazado interno entero.

### Decisiones y por qué

**Se ocultan, no se borran.** Es lo que pediste y además es lo correcto: la lista *es* el plan.
`docs/features/secciones-comunidad.md` dice qué es cada sección, cuál se resuelve con lo que ya
existe y en qué orden se entregan; borrar el arreglo dejaría el documento hablando de algo que ya
no está en el código.

**El interruptor vive en el dato, no en el consumidor.** Cada entrada tiene `published`, y los dos
menús —escritorio y móvil— leen `VISIBLE_COMMUNITY_ITEMS`. La alternativa (comentar el bloque en
`Nav` y otra vez en `MobileNav`) habría dejado dos sitios que olvidar cuando una sección se
publique.

**El rótulo «Secciones» se va con ellas.** Un encabezado seguido de nada se lee como un error de
la página, no como una sección vacía. El menú «Comunidad» no queda huérfano: sigue teniendo
publicaciones, productos y las categorías del catálogo.

**La prueba afirma la regla, no el estado.** No comprueba que la lista visible esté vacía —eso
caducaría el día que se publique la primera— sino que **ninguna entrada visible apunta a una ruta
que sigue siendo un stub**. Y comprueba que las seis siguen en el arreglo, porque perderlas es
perder el plan.

**Los escenarios que afirman que esas rutas responden 404 se quedan como están.** Son el
recordatorio deliberado que dejó el slice 1 de SEO: el día que una deje de ser un stub, esa prueba
falla y avisa de que hay que meterla al sitemap y poner su `published` en `true`.

### Archivos tocados

- **UI:** `Header/menuItems.ts` (+ prueba), `Header/Nav.tsx`, `Header/MobileNav.tsx`.
- **Docs:** `docs/features/secciones-comunidad.md` (el plan completo de las seis).

### Validación

Entró en la misma corrida que el slice 5 de SEO: `typecheck`, `lint` y `check:i18n` limpios,
**558 pruebas unitarias** verdes (+2 de este slice) y la suite e2e completa en verde.

### Pendientes que deja

- Los cinco slices siguientes están en `docs/features/secciones-comunidad.md`. El próximo sin
  bloqueo es el de **productores y negocios locales**, que no necesita migración: `origin.ts` ya
  distingue `productor_local` de `reventa_local`.
- **Bloqueado a propósito:** salud infantil, medio ambiente y deportes esperan las referencias
  científicas, que las aporta el usuario.

### Recap

El header ya no enlaza ninguna página inexistente. Las seis secciones siguen escritas en el código
con su texto, su destino y su descripción, apagadas con un `published: false` que se enciende
cuando cada una tenga contenido.

### Próximos pasos (opciones)

1. **Productores y negocios locales** (slice 1 del documento), cuando el slice 5 de SEO ya fijó la
   regla de qué entra al sitemap: los directorios la heredan.
2. **Pasar las referencias** para desbloquear salud infantil y medio ambiente.
3. Dejarlo así: el menú ya no miente, y el resto puede esperar a que haya vendedores que listar.
