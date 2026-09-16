# Publicar no debe enviarse solo al volver a un paso

## Contexto

- **Problema:** al volver a un paso anterior del asistente de `/publicar` y avanzar de nuevo, el
  formulario se envía solo, sin que nadie toque "Publicar".
- **Ahorro:** evita publicaciones a medias o accidentales, y evita el error confuso de "sube una
  imagen" que aparece sin que haya ningún problema real con la foto.
- **Por qué:** el pie de `PublishForm` promete por escrito que "publicar solo existe en el último
  paso" — este envío fantasma rompe esa garantía sin que se note en el uso normal.

## Slice único

Un solo slice: corregir el envío fantasma y cubrirlo con un escenario end-to-end.

### Causa

El botón de la derecha del pie del asistente ("Continuar" en los dos primeros pasos, "Publicar" en
el tercero) vive en la misma posición del JSX, en una rama `? :`, sin ninguna `key` que distinga un
botón del otro. Sin ella, React reutiliza el mismo nodo `<button>` del DOM entre un paso y el
siguiente y solo le muta el atributo `type`, en vez de desmontar uno y montar otro.

El navegador decide si un clic dispara el envío de un formulario mirando el `type` del botón
**después** de que React ya reaccionó al clic (la "activation behavior" corre tras el despacho del
evento), no el que tenía en el instante en que la persona lo tocó. Como consecuencia, un clic en
"Continuar" en el penúltimo paso puede terminar, a media ejecución de ese mismo clic, convertido en
un clic sobre "Publicar" — porque React ya cambió el `type` del nodo reutilizado a `"submit"` antes
de que el navegador evalúe si debe enviar el formulario.

La primera vez que se llega al último paso esto pasa inadvertido: el teléfono y la descripción
siguen vacíos, y `checkValidity()` (en `Form.tsx`) cancela ese envío fantasma. Pero si la persona ya
llenó el último paso una vez y **vuelve** a un paso anterior y regresa, esos campos ya tienen algo
escrito — el envío fantasma pasa la validación y publica de verdad, con lo que sea que haya en el
formulario en ese instante exacto.

### Arreglo

`key="back"` / `key="cancel"` y `key="next"` / `key="submit"` en los cuatro botones del pie de
`PublishForm.tsx`. Con `key` distinta, React siempre desmonta el botón saliente y monta uno nuevo en
su lugar, así que el `type` que el navegador ve en el momento del clic es siempre el correcto.

### Cobertura

`src/e2e/publicar/navegarSinPublicarSolo.feature` + `.spec.ts`: sube una foto, llena teléfono y
descripción, vuelve a "los detalles" con "Atrás", avanza de nuevo con "Continuar", y comprueba que
ninguna publicación se creó y que "Publicar" sigue visible y habilitado. Confirmado en rojo contra
el código anterior (con un test de investigación en Playwright real que capturó el POST fantasma
con su `next-action` header) y en verde tras el arreglo.
