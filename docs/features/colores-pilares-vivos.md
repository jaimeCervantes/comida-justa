# Colores vivos para Sueño y Mente/Espíritu

## Alineación

- **Problem:** Sueño y Mente/Espíritu perdieron la viveza de sus colores anteriores y ahora se
  perciben apagados.
- **Savings:** se evita seguir ajustando una paleta que ya funcionaba visualmente y se reduce la
  frustración al reconocer los pilares.
- **Why:** los cuatro pilares deben sentirse distintos y con energía, sin perder la relación de
  Alimentación y Movimiento con los colores de la marca.

## Modelo acordado

Se recuperan los matices anteriores: violeta para Sueño (semilla `#8b5cf6`) y azul cielo para
Mente/Espíritu (semilla `#38bdf8`). Cada matiz seguirá siendo una rampa `solid`/`soft`/`ink` para
mantener contraste AA; por eso las variantes usadas como texto o detrás de texto blanco pueden ser
más oscuras que la semilla. Alimentación y Movimiento no cambian.

## Roadmap

### Slice 1 - Recuperar los dos colores vivos

**Alcance**

- Cambiar únicamente las rampas de Sueño y Mente/Espíritu en los tokens de color.
- Actualizar el catálogo visual y la documentación que aún describen la paleta apagada.
- Mantener sin cambios todos los tokens de Alimentación y Movimiento.
- Verificar por prueba los valores acordados, la inmovilidad de los otros dos pilares y el contraste
  WCAG AA en claro y oscuro.

**Criterios de aceptación**

- Sueño vuelve a una familia violeta reconocible, derivada de `#8b5cf6`.
- Mente/Espíritu vuelve a una familia azul cielo reconocible, derivada de `#38bdf8`.
- Alimentación conserva `solid #dd340d`, `soft #fde3dd`, `ink #c52e0b`.
- Movimiento conserva `solid #408410`, `soft #e8f6df`, `ink #3c7b0f`.
- Blanco sobre cada `solid`, cada `ink` sobre su `soft` y cada `ink` sobre el fondo de página
  mantienen una relación de contraste de al menos 4.5:1 en claro y oscuro.
- Storybook identifica el origen real de los cuatro colores.

No hay slices futuros: este cambio visual queda completo al restaurar las dos rampas.
