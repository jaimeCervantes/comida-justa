# Bitácora — El pan cambia de color, y el idioma vuelve arriba

> Dos correcciones pedidas por el usuario, sobre [023](023-2026-08-23-nosotros-sin-emoji-bitacora.md)
> y [019](../platform/019-2026-08-22-pie-oscuro-bitacora.md).

---

## 1 · Un acento por bloque, y el pan en miel (2026-08-23)

### Por qué el barro no valía

El bloque del pan iba en `--brand-clay-700` (`#c52e0b`), que se lee como **rojo**. Al usuario no le
gusta, y tenía además un problema de sistema: es la semilla del naranja del logo, así que **el pilar
de Alimentación resuelve al mismo tono** (`--pillar-nutrition-ink`, el mismo hex). El recambio
«semántico» habría sido el mismo color.

### Qué se hizo

El pan toma la **miel** (`#7a5a03` sobre `#fdf3d6`): corteza y trigo, que es lo que ese bloque
enseña.

Y para que sea de **un solo bloque** —la segunda anotación del 5.11, «un acento por bloque»— el del
cacahuate se apaga a superficie neutra. Antes ni siquiera se cumplía dentro del propio cacahuate:
tenía la caja de «va bien con» en miel y la de «cómo guardarla» en barro, dos acentos para un mismo
producto. Lo que identifica a la crema son su foto y sus tres cualidades, no un fondo de color.

Queda así: el bloque del ecosistema en azul de Mente, el del cacahuate neutro, el del pan en miel.
Tres bloques, ningún par compitiendo.

## 2 · El idioma vuelve al header

El 5.16 lo baja al pie —«el header ya cargaba con búsqueda, publicar y cuenta»— y así se entregó.
Decisión del usuario: arriba. En un sitio de dos idiomas, cambiar de idioma es de las primeras cosas
que alguien busca, y el final de la página es encontrarlo tarde.

Vive **en un solo sitio**, no en los dos: un control duplicado obliga a preguntarse si son el mismo.

Con él vuelve su comportamiento: el desplegable se abre otra vez hacia abajo. El `side="top"` existía
porque desde el pie —al final de la página— un desplegable hacia abajo nace fuera de la pantalla y el
clic se queda colgado. **`avoidCollisions` se queda**, que es lo que lo salva en cualquiera de los
dos sitios.

El page object lo busca ahora **acotado al header**. Con ámbito y no suelto a propósito: mientras
estuvo en los dos sitios, un locator sin acotar habría resuelto a dos botones — y eso se descubre por
una violación de modo estricto, que cuesta una vuelta entera.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "…/chrome"` · `"…/nosotros"` | **73 + 3 en verde** |
| `pnpm run typecheck` · `lint` | limpios (1003 archivos) |
| `pnpm exec playwright test src/e2e/menu src/e2e/about src/e2e/chrome/pie.spec.ts` | **32/32** |

### Recap

El pan se ve en miel y es el único bloque que lleva acento; el cacahuate se apaga en vez de competir.
El idioma se cambia desde arriba, en un solo sitio, y su desplegable vuelve a abrirse hacia abajo sin
perder la protección contra bordes.
