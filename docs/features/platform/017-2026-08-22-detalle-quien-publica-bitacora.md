# Bitácora — Quién publica, junto al precio

> Fuente: `Hazlo Sano — Sistema de diseño v2`, sección **5.4 · detalle de publicación**.

---

## Slice 1 — «La persona es parte del producto» (2026-08-22)

### Qué dice el canvas y qué se hizo

El 5.4 deja dos lecciones escritas al pie. Esta entrega la primera:

> **La persona es parte del producto.** Nombre, distancia y tiempo de respuesta van junto al precio,
> no al final de la página.

Y es exacto: quien decide comprar lo hace arriba —foto, precio, quién lo vende— y a esa altura la
página solo enseñaba **un logo de 28px sin nombre**, metido en la misma fila que la categoría y la
insignia de agotado. El nombre entero quedaba al final, después del texto.

Ahora hay una tarjeta bajo el título con el nombre a la vista, el logo a 44px, quién lo publicó y la
distancia. Aplica a **26 de las 31 publicaciones** de la base, que son las que tienen tienda.

### La distancia se muda

Es la misma cifra que ya estaba, pero al lado de quién la recorre significa otra cosa: «Hazlo Sano,
a 3 km» es una frase; «Alimentación · agotado · a 3 km» es una lista.

Entra como `ReactNode` y no como metros. Quien la pinta —`StoreDistance` o el botón de compartir
ubicación— arrastra `next-auth` por su cadena de importaciones, y con eso dentro la tarjeta dejaba
de poder probarse sin montar media aplicación. Es el mismo trato que `bookingSlot` en `PostDetail`.
Por lo mismo, `PostSeller` **no traduce nada y es síncrono**: todo lo que enseña son nombres propios
que vienen del dato.

### Lo que el canvas pinta y no entró, con su razón

| Pieza | Por qué no |
| --- | --- |
| **«responde en ~2 h»** | No existe en la base. Medirlo exige seguir conversaciones que hoy ocurren fuera del sitio, en WhatsApp. |
| **La descripción de la tienda** | Existe (`sellers.description`) y aun así no entra: la de «Hazlo Sano» son **257 caracteres de lista numerada** —«1. Sueño:… 2. Alimentación:…»—, que recortada a una línea no dice nada. La columna es una biografía, no un lema. |
| **Entrega · pago · temporada** | Es la segunda lección del 5.4 y **necesita columnas nuevas**. La base es compartida con el backend de Python y se migra con Alembic allí; Drizzle aquí es solo de consulta. Queda propuesto, no hecho. |

Copiar la maqueta a costa de los datos habría dado una página que se ve como el diseño y miente.

### Un componente menos

`PostIdentity` desaparece: era la fila de dos logos sin nombre, y lo que hacía —decidir quién firma
según lo que exista— pasa entero a `PostSeller` con sus siete combinaciones. Sus `data-testid` se
conservan (`post-identity`, `post-identity-store`, `post-identity-author`), así que los escenarios
siguen hablando de lo mismo. La fila de datos que queda —categoría, procedencia, agotado, cuándo—
pasa a llamarse `post-meta`, que es lo que es.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/app/[locale]/[slug]"` | **9 pruebas** en verde (las 7 heredadas + 2 del hueco de la distancia) |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (1000 archivos) |
| `pnpm exec playwright test src/e2e/sellerStore` | **34/34** |
| `localProducers`, `compartir`, `seo` | **79 en verde**; 2 cayeron por `ENOTFOUND …pooler.supabase.com` y pasaron al repetirlas |

### Recap

La ficha dice de quién es con nombre, cara y distancia antes de que haya que bajar. Lo que el canvas
pide y la base no tiene se queda anotado con su razón, en vez de inventado.

### Próximos pasos (opciones)

1. **Entrega, pago y temporada** — pedir las tres columnas al backend de Python; son la segunda
   lección del 5.4 y, según el propio canvas, ahorran un mensaje de WhatsApp cada una.
2. **5.16 · pie de página y 404**, que salen en todas las páginas.
3. **5.14 · /carrito** y **5.15 · /cuenta**.
