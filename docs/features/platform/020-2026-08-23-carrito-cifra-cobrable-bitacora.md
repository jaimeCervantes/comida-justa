# Bitácora — La cifra que sí se cobra

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.14 · /carrito**.

---

## Slice 1 — Dos anotaciones del 5.14 (2026-08-23)

### Lo que ya estaba

El carrito llegaba con la estructura del canvas casi entera: un grupo por tienda con su propio botón
de confirmar, el total general **solo con dos tiendas o más** y con la nota de que no es un importe
cobrable, y lo agotado a la vista, marcado y fuera de la suma.

Este slice cierra las dos cosas que faltaban, y las dos son de las anotaciones que el canvas escribe
al pie.

### «El subtotal por tienda es la cifra cobrable»

Estaba, pero **al pie del grupo**, después de los renglones. Con tres productos había que bajar para
saber cuánto se le debe a esa tienda — y en un carrito de dos tiendas eso es justo lo que se está
comparando. Ahora también va junto al nombre, que es donde se escanea.

Sigue estando al pie, junto a su botón: ahí es donde se confirma.

La prueba afirma la **invariante** —las dos cifras son la misma— y no un número, porque cuál sea
depende de lo que haya en el carrito.

### «Lo agotado se queda, en cero»

Su importe se pintaba **en blanco**. Un hueco vacío se lee como «falta un dato»; un `$0` dice que el
renglón se contó y no sumó, que es exactamente lo que pasa — y así el importe y el aviso de arriba
cuentan la misma historia.

**No bastó con pasar un `0`.** `CurrencyAmount` devuelve `null` con un valor falsy, y con razón: un
anuncio no tiene precio y «$0.00» debajo de su título diría que es gratis. Los dos casos son
ciertos, así que la regla no cambia y se añade una opción —`showZero`— que elige quien llama. Se
descubrió leyendo el componente antes de dar por bueno el cambio; escrito sin mirar, habría quedado
un `0` que no pintaba nada.

### Lo que queda del 5.14

- La **distancia** y el «te contesta por WhatsApp» en la cabecera de cada tienda: la distancia existe
  en el sitio, pero esta página no la resuelve todavía; es un cambio en la carga de datos, no en la
  pintura.
- La línea **«tu compra local — $425 se quedan a menos de 4 km de tu casa»**, que depende de lo
  anterior.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run "src/presentation/money"` | **7 en verde** (3 nuevas del cero) |
| `pnpm run typecheck` · `lint` | limpios (1002 archivos) |
| `pnpm exec playwright test src/e2e/orders` | **32/32** |
| `cart.spec.ts` + `multiSeller.spec.ts` tras los cambios | **13/13** |

### Recap

Cuánto se le debe a cada tienda se ve sin bajar, y lo agotado dice `$0` en vez de dejar un hueco. La
regla de callar los importes vacíos sigue intacta para quien la necesita.

### Próximos pasos (opciones)

1. **La distancia por tienda en el carrito**, y con ella la línea de compra local.
2. **5.15 · /cuenta · abrir tienda y sucursales**.
3. **El conmutador de tema**, lo único que le falta al 5.16.
