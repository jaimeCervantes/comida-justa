# language: es
Característica: Volver a un paso no publica solo

  Contexto:
  - Problema: al volver a un paso anterior del asistente de /publicar y avanzar de nuevo, el
    formulario se envía solo, sin que nadie toque "Publicar".
  - Ahorro: evita publicaciones a medias o accidentales, y evita el error confuso de "sube una
    imagen" que aparece sin que haya ningún problema real con la foto.
  - Por qué: el asistente promete que publicar solo existe en el último paso (ver el comentario de
    `PublishForm.tsx` junto al pie del formulario); este envío fantasma rompe esa garantía.

  Como alguien que ya llenó el último paso del asistente de publicar
  Quiero poder volver a revisar un paso anterior y regresar
  Sin que eso dispare la publicación por sí solo

  Antecedentes:
    Dado que inicié sesión
    Y que abrí "/publicar"

  @slice-1
  Escenario: Volver a "los detalles" y avanzar nunca publica solo
    Dado que ya llené el título, el precio, el teléfono, la descripción y subí una foto
    Cuando vuelvo al paso "los detalles" con "Atrás"
    Y avanzo de nuevo con "Continuar"
    Entonces ninguna publicación se creó todavía
    Y el botón "Publicar" sigue ahí, visible y habilitado
