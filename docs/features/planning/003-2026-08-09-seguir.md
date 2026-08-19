# Seguir: publicar deja de ser gritar al vacío

## El problema

Publicar no tiene consecuencia. Quien publica no acumula nada entre una publicación y la siguiente,
y quien mira no tiene forma de decir «esto me interesa». Las páginas de tienda y de perfil se
sienten vacías porque **literalmente no hay ninguna señal de que alguien esté al otro lado**: ni un
número, ni una lista, ni un botón.

### Lo que dice la base (consultada el 2026-08-09)

| dato | valor |
| --- | --- |
| usuarios | 21 |
| con dirección personal reclamada | **1** |
| con `external_id` de canal | **21** |
| tiendas | **1** (`hazlo-sano`, con dueño) |
| publicaciones | 23 |
| tabla `follows` | no existe |

Dos cosas que este inventario decide:

**El contador va a estar en cero.** Hay una tienda y un perfil. Un «0 seguidores» es peor que no
decir nada: convierte una página nueva en una página abandonada. Por eso el número **no se pinta
hasta que hay al menos uno**.

**Los 21 usuarios ya tienen `external_id`.** Es la identidad de canal que dejó la migración
`3f03852a04ce`. No se usa en este slice, pero cambia lo que costará el aviso por Telegram más
adelante: puede que el enlace entre cuenta web y chat ya exista para casi todos. Hay que
verificarlo antes de diseñar ese slice, no darlo por hecho: un `external_id` puede ser el de Google
y no el del bot.

## Lo que ahorra

Una tienda deja de empezar de cero en cada visita. El número de seguidores es lo que hace que un
desconocido le dé una oportunidad, y es lo único de esa página que un competidor no puede copiar.

Del lado del código, seguir es la **primitiva** de la que cuelgan el feed propio («lo que sigo») y
el aviso al publicar. Es una tabla que se paga tres veces.

## Por qué

Es la pieza que convierte un catálogo en una red. Hoy el sitio sabe qué se vende y dónde está;
seguir es lo primero que le enseña **quién le importa a quién**.

## Decisiones

### Una tabla con destino polimórfico, no dos

Se sigue a una tienda **o** a una persona, y hace falta poder hacer las dos: una tienda creada por
el chatbot puede no tener dueño, y una persona puede publicar sin tener tienda —5 de las 23
publicaciones están así—. Dos tablas duplicarían cada consulta de contador y cada índice para una
distinción que a quien mira no le importa. Un `CHECK` de `num_nonnulls(...) = 1` garantiza que cada
fila apunta a exactamente uno.

### La unicidad la pone la base, no el código

Dos índices únicos parciales, uno por destino. Sin ellos, un doble clic o dos pestañas dejan dos
filas y el contador miente. Un `INSERT ... ON CONFLICT DO NOTHING` se apoya en ellos.

### Nadie se sigue a sí mismo

Un `CHECK` lo impide en la persona. En la tienda no se puede expresar en SQL —el dueño está en otra
tabla—, así que ahí lo decide la interfaz: a quien es dueño no se le ofrece el botón, se le invita a
compartir.

### El contador se oculta en cero, no se pinta en gris

Con cero no hay número. El dueño ve una invitación a compartir y el visitante ve el botón de seguir
sin que se le diga que no lo sigue nadie. Es una regla de dominio, no de CSS: se prueba con tabla.

### Seguir exige sesión

No hay forma de recordar a un anónimo, y un «seguidor» que se pierde al cerrar el navegador no es un
seguidor. A quien no ha entrado se le lleva a iniciar sesión y se vuelve a la misma página.

## Los slices

### Slice 1 — Seguir, y que se note

**Alcance.**

- Alembic `0031` en el backend: tabla `follows` con sus dos `CHECK` y sus dos índices únicos
  parciales.
- `src/domain/follow/`: a quién se puede seguir, quién no puede seguirse, y cuándo se enseña el
  contador.
- Caso de uso de seguir/dejar de seguir, idempotente.
- Botón en la tienda (`StoreHeader`) y en el perfil (`ProfileHeader`), con su contador.

**Criterios de aceptación.**

1. Con sesión, seguir una tienda la deja seguida, y el contador sube en el acto.
2. Volver a pulsar deja de seguirla; pulsar dos veces seguidas no crea dos filas.
3. Con cero seguidores no se pinta ningún número, en ninguna de las dos páginas.
4. Al dueño no se le ofrece seguirse: se le invita a compartir.
5. Sin sesión, el botón lleva a entrar y devuelve a la misma página.

### Slice 2 — El feed de lo que sigo (`@future`)

Una pestaña en el home con las publicaciones de a quién sigues. No necesita ningún canal externo, y
es lo que le da sentido a haber seguido a alguien.

### Slice 3 — El aviso al publicar (`@future`)

Por el `SocialPublisherPort` que ya existe en el backend, empezando por Telegram. **Antes hay que
verificar** si `users.external_id` es de verdad el chat del bot o el identificador de Google: de eso
depende que enlazar la cuenta sea gratis o sea otro slice entero.

## Riesgos

- **`alembic upgrade head` sobre la base compartida.** Es una tabla nueva, así que no toca nada
  existente y ningún repositorio se entera hasta que la consulte.
- Con una tienda y un perfil, el slice se puede probar pero no se puede *ver* funcionando como red.
  Lo que valida de verdad es que existan más tiendas, y eso no lo arregla este trabajo.
