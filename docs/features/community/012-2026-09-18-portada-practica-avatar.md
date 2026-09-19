# La portada de práctica se parte con el avatar de quien practica

> Roadmap de un solo slice. Sin `.feature`/Playwright: es un cambio de solo render sobre un
> componente ya cubierto por pruebas de componente (`PracticeCover.test.tsx`), sin navegación,
> formulario ni ida y vuelta a una API — no hay flujo end-to-end nuevo que cruzar.
> Continúa `010-2026-09-06-practicas-como-publicaciones.md` (slice 2), que introdujo `PracticeCover`
> como portada de una práctica sin evidencia.

## Alineación

**Problem.** Cuando una práctica se publica sin evidencia (que es el caso normal: el ritual no la
pide), `PracticeCover` solo enseña el color y el número del pilar. No dice quién practicó, aunque el
feed es social y ahí "quién lo hace" importa tanto como "qué pilar es".

**Savings.** Reconocimiento de autoría sin pedirle a nadie que suba una foto nueva — sigue sin haber
evidencia obligatoria, pero la portada deja de sentirse anónima.

**Why.** Conecta con "la red social de las prácticas" (`008-2026-09-05-la-red-social-de-las-practicas.md`):
el feed vive de mostrar comunidad, no solo categoría.

## Modelo acordado

- Se usa la portada partida (mitad pilar / mitad avatar) **solo cuando la práctica no trae
  evidencia** — la misma condición que ya decide si se pinta `PracticeCover` en vez de la foto real
  (`kind === PRACTICE_POST_KIND && !media[0]`). Con evidencia, manda la foto como siempre; el avatar
  no reemplaza nunca a la evidencia real.
- La mitad del pilar no cambia: sigue siendo el sello dibujado (círculo + número + nombre), nunca un
  archivo — ver el docstring de `PracticeCover` sobre por qué no se descarga una imagen por pilar.
- La otra mitad es el avatar de quien publicó, reutilizando el componente `Avatar` ya existente
  (`src/presentation/user/Avatar`), con su mismo respaldo de iniciales cuando no hay foto de perfil.
  No nace un componente de avatar nuevo.
- Las mitades se apilan **verticalmente**: arriba el avatar, abajo el sello del pilar.

## Slice único — Portada partida en tarjeta y ficha

**Alcance.**

- `PracticeCover` recibe un `user` (mismo `PostUser` que ya circula en `CardForList`/`PostDetail`) y
  divide su área en dos mitades apiladas: arriba el `Avatar` de `user`, abajo el sello del pilar.
- `CardForList` y `PostDetail` pasan `user`/`postDetails.user` a `PracticeCover` en sus dos llamadas.
- Sin evidencia sigue siendo la única condición: una práctica con foto/video sigue mostrando su
  media, sin tocar esta portada.

**Criterios de aceptación.**

1. Una práctica sin evidencia enseña el sello del pilar en una mitad y el avatar de quien la publicó
   en la otra, en tarjeta y en ficha.
2. Sin foto de perfil, la mitad del avatar cae en las iniciales, igual que en cualquier otro lugar
   del sitio.
3. Una práctica con evidencia sigue mostrando su foto/video, sin la portada partida.
4. Un producto o servicio sin foto conserva su recuadro de siempre — la portada partida es solo de
   prácticas.

## Fuera de alcance

- Cualquier tamaño de avatar nuevo en el design system: se reutiliza el `md` que ya existe.
- Mostrar el nombre de quien practica dentro de la portada (ya lo dice la firma de la tarjeta/ficha).

## Slice 2 — La portada del home tampoco se queda vacía

**Problem.** `HomeHero` enseña "lo último que publicó la comunidad" en el lado derecho de la
portada de escritorio, pero solo si esa publicación trae foto (`latest?.media?.[0]`). Una práctica
—que hoy es lo más común, porque el ritual no pide evidencia— deja ese lado completamente vacío
junto al titular "Cuidar tu salud, es cuidar tu tiempo".

**Savings.** El hero deja de depender de que lo último publicado traiga foto para cumplir su propia
promesa.

**Why.** Mismo espíritu del slice único: una práctica es una publicación de primera clase y también
puede protagonizar la portada, no solo el feed.

**Alcance.**

- En `HomeHero`, cuando `latest.kind === PRACTICE_POST_KIND` y no trae media, se usa `PracticeCover`
  en el lugar de la foto — la misma portada partida avatar/pilar del slice único, con el mismo alto.
- Se aplica la misma comprobación de pilar válido que ya usa `PracticeCover` internamente
  (`publicationPillarForCategory`), para no dejar un enlace con el pie de foto y nada arriba cuando
  la categoría no cuelga de ningún pilar.
- Con foto real, el hero sigue mostrándola como hoy. Ningún otro tipo de publicación cambia: un
  producto/servicio/anuncio sin foto sigue sin pintar nada en el hero.

**Criterios de aceptación.**

1. Si lo último publicado es una práctica sin evidencia con categoría de pilar válida, el hero
   enseña la portada partida (avatar/pilar) en vez de un hueco.
2. Si lo último publicado trae foto, el hero sigue mostrando esa foto.
3. Si lo último publicado no tiene foto y no es una práctica con pilar válido, el hero sigue sin
   inventar una portada — como antes.
