# Bitácora — El pie cierra la página

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.16 · pie de página y 404**.
> Continúa [018 — el 404](018-2026-08-22-404-explica-la-causa-bitacora.md).

---

## Slice 2 — La banda oscura (2026-08-22)

### Las tres instrucciones del canvas, y qué se hizo con cada una

| Instrucción | Estado |
| --- | --- |
| «El pie es oscuro a propósito: cierra la página y libera el papel claro para el contenido» | **hecho** |
| «Los pilares aparecen con su número, como en todas partes» | **hecho**, y de paso dejan de ser decoración |
| «Idioma y tema viven aquí; salen del header» | **idioma sí**; el tema, no — ver abajo |

### Una superficie que no sigue al tema

Un pie que se aclara con el tema claro deja de cerrar nada. Así que `--surface-inverted` y sus tres
tintas **se declaran una sola vez, fuera de los dos bloques de tema**: valen lo mismo en claro y en
oscuro. `darkThemeParity.test.ts` sigue cuadrando —compara esos dos bloques entre sí, y aquí no
entra ninguna—, y para que la pareja no quede sin vigilar se añade
`invertedSurface.contrast.test.ts`, que la mide igual que las rampas de marca y de pilares.

**El canvas dice que el verde de enlaces sobre `#101410` da 8.4:1. Da 6.16.** Sobra para AA, así que
el color entra tal cual; lo que no entra es el número, y queda escrito en una prueba para que nadie
lo repita de memoria ni retoque el verde buscando un 8.4 que nunca existió.

### La clase que no compiló

`--color-text-on-inverted` genera la utilidad `text-text-on-inverted`. La que estaba escrita en el
componente era `text-on-inverted`, que **no existía** — y en Tailwind v4 eso no falla, desaparece: el
texto se quedó del color que heredaba, sobre un fondo casi idéntico.

Lo cazó `e2e/chrome/pie.spec.ts` midiendo **1.10** de contraste en el navegador. Los alias pasan a
llamarse `--color-on-inverted` / `--color-on-inverted-support`, que es el nombre que la utilidad
necesita. Es la tercera vez que este repo tropieza con lo mismo, y la primera en que una prueba lo
ve antes que una persona.

### Los pilares dejaron de ser palomitas

Eran cuatro `✓` con un nombre al lado, sin enlace: decoración justo donde alguien busca a dónde ir.
Ahora llevan a su pilar y traen su número — y el número sale de `publicationPillarNumber`, no del
orden de la lista. Para eso, `PILLAR_ITEMS` gana un campo `pillar` con la clave del dominio: es lo
que permite reordenar el menú sin renumerar los cuatro pilares, que es exactamente lo que
`publicationPillars.ts` dejó escrito que no debía pasar.

La columna de comunidad sale de `VISIBLE_COMMUNITY_ITEMS`, que ya filtra los stubs que responden 404
a propósito: el pie no puede enlazarlos por descuido.

### El idioma baja, y se abre hacia arriba

Mudarlo al pie descubrió un defecto propio: un desplegable que se abre **hacia abajo** desde el final
de la página nace fuera de la pantalla. Se vio porque el escenario que cambia a inglés se quedó
colgado en el clic —«element is outside of the viewport»—, y se arregla con `side="top"` más
`avoidCollisions`, que es preferencia y no imposición.

El conmutador de **tema** del canvas no entra: no existe en la aplicación. Haría falta el
interruptor, dónde recordar la elección y un script que evite el parpadeo al cargar. Es su propio
slice, no un añadido de éste.

### Una prueba que dejó de copiar la implementación

`Footer.test.tsx` afirmaba `toHaveClass("text-pw-green")`. El defecto que vigilaba —el logotipo
recortado contra un degradado, ilegible— sigue vigilado; la clase exacta ya no, porque cambió al
volverse oscuro el pie y volverá a cambiar. Lo que la tinta tiene que cumplir lo mide el contraste.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "…/design_system/tokens"` | **124 en verde** (5 nuevas de la banda) |
| `pnpm exec vitest --run "…/chrome"` | **74 en verde** |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios (1002 archivos) |
| `pnpm exec playwright test src/e2e/chrome` | **30/30** tras corregir el alias |
| `src/e2e/menu`, `src/e2e/i18n` | **en verde** tras abrir el desplegable hacia arriba |

### Recap

El pie cierra la página en oscuro con una superficie que no participa del tema y está medida, los
pilares llevan a alguna parte con su número, y el idioma se cambia desde donde se cambia una vez.
Una clase que no compilaba se descubrió midiendo el navegador, no leyendo el `class`.

### Próximos pasos (opciones)

1. **El conmutador de tema**, que es lo que le falta al 5.16.
2. **5.14 · /carrito** y **5.15 · /cuenta**.
3. **Entrega, pago y temporada** del 5.4 — bloqueado hasta que el backend de Python migre.
