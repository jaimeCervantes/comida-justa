# 027 · Editor enriquecido para la descripción de las publicaciones

> **Estado: pendiente, sin empezar.** Documentado el 2026-08-23 a petición del usuario, que lo dejó
> en pausa para hacer antes el slice 3 de `026-la-semana-que-vuelve`. Este documento guarda lo que ya
> se investigó para no volver a investigarlo.

## Contexto

- **Problema:** la descripción de una publicación se escribe en un `textarea` y se pinta como texto
  plano. Quien publica no puede poner un encabezado, una negrita ni una cursiva — y ya lo está
  intentando: hay quien escribe `**así**` y le sale con los asteriscos a la vista.
- **Ahorro:** una descripción legible se lee entera. Hoy los productos con historia larga —el de la
  crema de cacahuate son 1487 caracteres— llegan como un muro de texto.
- **Por qué:** las publicaciones son el contenido de la comunidad. Si escribirlas bien es imposible,
  el catálogo se llena de párrafos que nadie termina de leer.

## Lo que dice la base de datos (23 de agosto de 2026)

59 traducciones: 31 en español, 28 en inglés. Largo medio 404 caracteres, máximo 1487.

| Señal | Cuántas | Qué pasa hoy |
| --- | --- | --- |
| Con saltos de línea | 30 de 59 | **Se ven bien.** `PostDetail` usa `whitespace-pre-wrap` |
| Con viñetas `- ` a mano | 8 | Se ven como guiones, sin sangría ni marca |
| Con `**negritas**` de markdown | 2 | **Salen los asteriscos literales en la página** |
| Con HTML | 0 | — |

El caso real que lo hace evidente:

```
🥜 **¿Tu crema de cacahuate tiene más ingredientes que cacahuate?**
```

Eso es lo que ve quien entra. La gente ya está escribiendo markdown a ciegas.

## Por qué no es un slice pequeño

`post_translations.content` es `text` y lo pinta `PostDetail.tsx:386` con `whitespace-pre-wrap`, o
sea texto plano escapado por React — hoy es seguro por construcción. Meter marcado toca **~48
archivos**, y no por acoplamiento accidental: ese texto alimenta de verdad a todos ellos.

| Consumidor | Qué le pasa con marcado |
| --- | --- |
| `GeminiTranslationService` | El modelo tiene que devolver el marcado intacto, o el inglés pierde los encabezados |
| Embedding de 768 dimensiones (`indexPostEmbedding`) | Los asteriscos y las etiquetas ensucian el vector: hay que indexar el texto, no el marcado |
| `buildMetaDescription` (`domain/seo/description.ts`) | La vista previa de WhatsApp no puede llevar `**` |
| `GeminiContentModerationService` | Modera lo que lee una persona, no las marcas |
| `jsonLd.ts`, `rss.xml`, `llms.txt` | Cada uno quiere el texto en su propio formato |
| Snippets de búsqueda y `CardForList` | Recortan a N caracteres: cortar a mitad de una etiqueta la rompe |
| El bot de Python | **Escribe publicaciones directo a la base, en texto plano** |

Esa última fila manda: el renderizador tiene que seguir pintando bien lo que ya existe y lo que el
bot siga escribiendo. No hay migración de contenido que valga.

## Las decisiones que hay que tomar antes de escribir código

1. **Formato de almacenamiento.** Markdown acotado, HTML saneado, o JSON estructurado (tipo Tiptap).
   Markdown acotado es lo que ya escribe la gente sola, sobrevive a `whitespace-pre-wrap` si el
   renderizador falla, y se limpia con una función para embedding y meta. Es la apuesta a batir.
2. **Qué se permite.** Encabezados, negrita, cursiva, listas y poco más. Cada elemento nuevo es un
   caso más en el traductor, el limpiador y el renderizador.
3. **Una sola función de aplanado**, en `domain/`, que quite el marcado. La usan embedding,
   meta description, JSON-LD, RSS y los snippets. Si cada uno improvisa la suya, se desincronizan.
4. **Compatibilidad hacia atrás sin migrar.** Texto plano tiene que seguir viéndose igual: los
   saltos de línea de las 30 publicaciones que ya los tienen no pueden cambiar de aspecto.
5. **El editor en sí.** Un `contentEditable` propio es una trampa; hay librerías. Pero la regla del
   repo es preferir lo que ya está en `package.json` antes de meter una nueva.

## Slices propuestos (sin acordar)

1. **Se lee el marcado que la gente ya escribe.** Solo el renderizador y el aplanado: `**negrita**`,
   `*cursiva*`, `## encabezado` y listas dejan de salir en crudo. Sin editor todavía. Arregla las dos
   publicaciones rotas de hoy y no cambia el formulario.
2. **La barra de herramientas.** Botones sobre el mismo `textarea` que insertan el marcado.
3. **Vista previa** junto al formulario, reusando el renderizador del slice 1.
4. **El traductor conserva el marcado**, con su prueba.

## Cómo retomarlo

Empezar por el portón de alineación con este documento delante, acordar el punto 1 (formato de
almacenamiento) y arrancar por el slice 1, que es el único que entrega valor sin tocar el formulario.
Ver también `026-2026-08-23-la-semana-que-vuelve.md`, que es lo que se hizo primero y por qué.
