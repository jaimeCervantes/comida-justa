# Bitácora — El 404 dice qué pasó

> Fuente: `Hazlo Sano — Sistema de diseño v2` (standalone), sección **5.16 · pie de página y 404**.

---

## Slice 1 — La página que se encuentra quien llega tarde (2026-08-22)

### Qué había

Una broma repartida en cuatro encabezados —`h1` a `h4`, con el `h4` haciendo de párrafo—: «se fue a
hacer una serie extra de burpees… ¡y se agotó!», una ilustración de alguien descansando y un botón
al inicio.

Nada de eso contestaba la única pregunta de quien llega: **¿me equivoqué yo?**

### Qué dice el canvas

> **El 404 explica la causa más probable.** En un marketplace las páginas mueren de verdad: una
> publicación vencida no es un error del visitante.

Y es literal: aquí la gente publica, y una publicación se vence, su dueño la borra, un evento pasa.
«Pasa, y no es tu culpa» es **información**, no consuelo: quien cree haberse equivocado vuelve a
teclear la misma dirección.

### Qué hay ahora

- El código (`404`) como antetítulo, y un `h1` que dice qué ocurrió.
- Un párrafo con la causa probable.
- **Dos salidas, no una**: «ver lo que hay hoy» para quien venía a mirar y «buscar otra cosa» para
  quien venía a por algo concreto — que es justo quien llega aquí desde un enlace viejo.
- Tres sugerencias: productores locales, eventos y los cuatro pilares.

La ilustración se retira: enseñaba a alguien descansando, que acompañaba a la broma y contradice al
mensaje nuevo.

### Lo único que puede empeorar un 404

Mandar a otro 404. Las seis secciones de comunidad responden 404 **a propósito** —lo afirma
`seo.spec.ts`— y un enlace a cualquiera de ellas se vería perfectamente bien en el DOM. Por eso los
tres destinos sugeridos se comprueban **navegando**, no leyendo el `href`: un escenario por salida,
que exige un 200.

### El 404 de la raíz también

`src/app/not-found.tsx` vive **fuera de `[locale]`**: no hay `NextIntlClientProvider` ni
`getTranslations`, así que su texto va en español a mano —la misma razón por la que `Badge` recibe
el suyo ya traducido—. Dice lo mismo con menos: sin sugerencias, porque los destinos que ofrecería
son rutas traducidas y a esa altura el idioma todavía no está decidido.

### Una prueba que dejó de copiar el copy

El escenario que ya existía afirmaba `getByRole("heading", { name: /recurso no encontrado/i })`.
Eso es texto de redacción, y una prueba que lo copia se cae en cada afinado de tono — es exactamente
lo que `AGENTS.md` prohíbe desde la semana pasada. Ahora afirma que **hay un `h1`**; lo que la
página promete tiene sus propios escenarios.

### Validación

| Comando | Resultado |
| --- | --- |
| `pnpm exec vitest --run` | **2295 en verde**; 1 timeout de 5 s bajo carga de la suite completa (`PublishForm.validation`), verde en aislado |
| `pnpm run typecheck` · `lint` · `check:i18n` | limpios |
| `pnpm exec playwright test src/e2e/notFound` | **8/8** |

En la primera corrida, dos de los tres escenarios de salidas fallaron con 404: era la compilación en
frío de esas rutas en el servidor de desarrollo. Comprobado aparte, `/pilares`,
`/productores-locales`, `/eventos` y `/buscar` responden **200** las cuatro.

### Recap

Quien llega a una dirección muerta se entera de por qué, y tiene dos salidas y tres sugerencias que
—comprobado navegando— existen.

### Próximos pasos (opciones)

1. **El pie de página del 5.16**: oscuro a propósito, con los pilares numerados, y el idioma y el
   tema mudándose ahí desde el header.
2. **5.14 · /carrito** y **5.15 · /cuenta**.
3. **Entrega, pago y temporada** del 5.4 — bloqueado hasta que el backend de Python migre las
   columnas.
