# Practicas como publicaciones

> Roadmap de slices. Escenarios: `src/e2e/habits/practicasComoPublicaciones.feature`.
> Continua el trabajo de `009-2026-09-05-tablero-semanal-de-practicas.md`: el tablero hizo
> visible el avance; este roadmap convierte la practica con evidencia en una pieza social.

## Alineacion

**Problem.** Las practicas ya existen y el avance semanal es visible, pero la accion sana sigue
escondida frente al feed social. Quien practica recibe progreso privado, pero poco reconocimiento
publico; ademas, la regla de un conteo por pilar y dia impide registrar varias acciones reales del
mismo pilar cuando la persona aporta evidencia.

**Savings.** Se reduce friccion para practicar desde `/habitos`, se evita duplicar formularios de
publicacion, se da reconocimiento social a evidencia real y se protege el feed contra spam al
distinguir check-in simple de practica publicada.

**Why.** Hazlo Sano debe sentirse como una red social de cosas sanas: practicar, cocinar, moverse,
descansar y convivir deberian tener tanta presencia como publicar un producto o anuncio. La
gamificacion correcta es visibilidad, apoyo y progreso, antes que competencia abierta.

## Referentes usados

- Strava: una actividad es una unidad social con feed, fotos, comentarios y kudos; tambien conserva
  controles de privacidad y reglas contra interacciones repetitivas.
- Facebook, Instagram y TikTok: el contenido social se entiende por media, comentarios, reacciones y
  control de audiencia.
- Fabulous: no empieza con competencia; reduce carga cognitiva con rutinas, journeys, challenges y
  pasos diarios pequenos. La leccion para este producto es que cada slice debe hacer mas facil
  iniciar o completar una practica de un pilar, no solo hacerla mas visible.
- Literatura de gamificacion: los leaderboards pueden motivar, pero tambien activan comparacion
  social. Por eso aqui se propone reconocimiento destacado sin mostrar posiciones ni los ultimos
  lugares.

## Modelo acordado

- Una practica sin evidencia sigue siendo check-in ligero: cuenta como aporte basico, con limite de
  un conteo por pilar y dia.
- Una practica con foto o video se convierte en una publicacion de practica.
- La evidencia permite practicar mas de una vez cualquier pilar en el mismo dia.
- Las publicaciones de practica viven en el feed junto a publicaciones normales.
- La publicacion de practica reutiliza el modelo de post existente: media, titulo, descripcion,
  autor, slug, comentarios y moderacion.
- El formulario de practica no duplica `/publicar`: es una variante preconfigurada con los mismos
  componentes reutilizables, sin precio, procedencia, telefono, fecha de evento ni duracion.
- El pilar de la practica preselecciona la categoria raiz correspondiente del post
  (`sueno_y_descanso`, `alimentacion`, `movimiento_y_ejercicio`, `mente_y_espiritu`).
- La descripcion publica puede partir de lo informativo de la practica y aceptar una nota personal
  corta como complemento.
- Toda publicacion de practica puede recibir comentarios y reacciones.
- El usuario siempre decide: en este slice, "Publicar evidencia" es una accion social explicita.
  Quien no quiera publicar conserva el check-in simple actual.
- El jardin sigue siendo progreso colectivo.
- Habra reconocimiento semanal de practicantes destacados: maximo 10 personas, sin posiciones
  visibles, sin mostrar cola de tabla y sin lenguaje de ganador unico.

## Principios de UX por slice

- Cada slice debe reducir pasos para agregar una practica de cualquier pilar.
- La accion primaria debe vivir donde el usuario ya esta practicando: `/habitos`.
- La evidencia debe sentirse como parte de practicar, no como abrir otro flujo de publicacion.
- El formulario debe empezar pequeno: evidencia, texto opcional y publicar. Titulo, pilar y
  descripcion base se derivan de la practica para ahorrar escritura.
- La retroalimentacion debe decir que paso: "Se guardo tu practica" o "Se publico en el feed".
- El reconocimiento debe empujar apoyo entre personas, no verguenza publica.

## Slices

### Slice 1 - Evidencia desde `/habitos` crea publicacion de practica

**Alcance.**

- Cada practica activa en `/habitos` ofrece una accion clara para practicar con evidencia.
- El usuario puede subir foto o video desde la misma tarjeta de practica.
- Puede agregar texto opcional corto.
- Publicar evidencia es una accion social explicita; guardar privado sigue siendo el check-in
  simple sin evidencia.
- Si confirma, se crea una publicacion de tipo practica visible en el feed, usando el mismo sistema
  de posts y media.
- Con evidencia se permite repetir el mismo pilar mas de una vez el mismo dia.
- Sin evidencia se conserva la regla actual de un conteo por pilar/dia.
- El formulario ya viene configurado con la practica y su pilar; la persona no elige categoria,
  tipo de post, precio ni datos de contacto.

**Criterios de aceptacion.**

1. Una persona con una practica activa puede abrir el flujo de evidencia sin salir de `/habitos`.
2. Al subir foto o video y compartir, aparece una publicacion de practica en el feed.
3. La publicacion muestra persona, pilar, practica, evidencia, descripcion base y texto opcional.
4. El mismo pilar puede publicarse mas de una vez el mismo dia si cada intento trae evidencia.
5. Marcar sin evidencia no crea publicacion ni duplica el conteo del pilar ese dia.
6. El flujo deja claro que la evidencia quedo publicada.

### Slice 2 - Tarjeta social de practica en feed y perfil

**Alcance.**

- El feed distingue visualmente una publicacion de practica de un producto, evento, servicio o
  anuncio.
- La tarjeta enlaza al perfil publico de la persona si existe username.
- La tarjeta enlaza al pilar/practica para que otra persona pueda empezar facil.
- El perfil publico incluye publicaciones de practica junto a practicas compartidas.

**Criterios de aceptacion.**

- Una publicacion de practica no parece venta ni evento.
- El CTA natural es practicar algo parecido, no comprar.
- La tarjeta se entiende con una sola mirada en movil.
- El perfil muestra evidencia reciente sin exponer practicas privadas.

### Slice 3 - Reacciones para publicaciones de practica

**Alcance.**

- Agregar reacciones simples a publicaciones de practica.
- Reusar el tono de apoyo de las celebraciones actuales.
- Evitar reacciones negativas.
- Mostrar conteo agregado y estado del usuario actual.

**Criterios de aceptacion.**

- Una persona autenticada puede reaccionar una vez y retirar su reaccion.
- Una persona no autenticada ve el reconocimiento, pero no puede reaccionar sin iniciar sesion.
- La reaccion no afecta ranking ni inventario de puntos.

### Slice 4 - Apoyo como infraestructura social de cualquier publicacion

**Replantea el slice original.** El roadmap decia "comentarios en publicaciones de practica", pero
los comentarios ya existian para toda publicacion antes de este slice (confirmado con el usuario):
no hay nada que habilitar ahi. Lo que si distinguia una practica del resto era el boton de apoyo del
slice 3, restringido por `kind`. Si una practica es una publicacion mas, el apoyo y el conteo de
comentarios deberian ser capacidad de cualquier publicacion; lo que cambia por tipo es el CTA
principal (comprar, agendar, asistir, contactar), no si puede recibir reconocimiento social.

**Alcance.**

- Generalizar `practicePostReactions` a `postReactions`: dominio, caso de uso, puerto e
  infraestructura dejan de preguntar por `kind`.
- `PostReactionButton` (antes `PracticePostReactionButton`) se muestra en cualquier tipo de
  publicacion, junto al CTA propio del tipo, sin reemplazarlo.
- La tabla y las consultas ya eran genericas desde el slice 3 (`post_reactions` sobre `posts`, sin
  filtro de `kind`); este slice solo quita la restriccion que quedaba en la UI.

**Criterios de aceptacion.**

1. Una publicacion de cualquier tipo (practica, producto, evento, servicio, anuncio) muestra el
   control de apoyo con su conteo, en tarjeta y en detalle.
2. Reaccionar y retirar la reaccion funciona igual sin importar el tipo de publicacion.
3. El CTA especifico del tipo sigue visible junto al apoyo: comprar, agendar, practicar algo
   parecido, etc.
4. Quien no ha iniciado sesion ve el reconocimiento pero no puede reaccionar sin entrar.

### Slice 5 - Practicantes destacados de la semana

**Alcance.**

- Mostrar hasta 10 practicantes destacados de la semana.
- El orden visible debe ser no posicional: sin #1, #2, medallas, coronas ni ganador unico.
- La seleccion puede usar volumen con evidencia, variedad de pilares y constancia semanal.
- No se muestra tabla completa ni ultimos lugares.

**Criterios de aceptacion.**

- La seccion reconoce actividad real de la semana.
- Nadie ve su posicion si no esta destacado.
- El texto habla de inspiracion y constancia, no de derrota.
- Cada persona destacada enlaza a su perfil publico.

## Fuera de alcance inicial

- Ranking completo con posiciones visibles.
- Premios, dinero, coronas o trofeos.
- Publicar practicas sin consentimiento explicito.
- Algoritmo opaco de recomendacion infinita.
- Moderacion automatica nueva para imagen/video, salvo lo que ya exista en el pipeline de media y
  posts.
