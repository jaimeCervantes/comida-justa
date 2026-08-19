# Retos atomicos: del pilar a la practica

Roadmap para convertir los cuatro pilares de Hazlo Sano en acciones pequenas, repetibles y
socialmente reforzadas. El primer reto es **Del atardecer al amanecer**, un ritual de descanso que
empieza con una sola repeticion y crece sin exigir perfeccion.

Este documento conserva las decisiones de producto iteradas antes de implementar. La especificacion
ejecutable vive en `src/e2e/habits/atomicSleepChallenge.feature` y la bitacora por slice en
`docs/features/wellbeing/003-2026-08-11-retos-atomicos-bitacora.md`.

## Problema / Savings / Why

- **Problema:** los cuatro pilares explican por que importa dormir, comer, moverse y conectar, pero
  al terminar el articulo no existe una accion concreta, una forma de volver manana ni una senal de
  que la comunidad acompana. Retrasar toda recompensa hasta el final de una semana deja sola la
  repeticion mas fragil: la primera.
- **Savings:** un ritual prearmado elimina decisiones al final del dia; la version minima reduce la
  frustracion de no poder hacerlo todo; la recompensa inmediata y el reconocimiento voluntario
  reducen abandono. Empezar por una repeticion valida la conducta antes de pagar la complejidad de
  siete dias, grupos, Telegram o clasificaciones.
- **Why:** Hazlo Sano no quiere ser solo un catalogo ni una biblioteca. Su promesa es ayudar a vivir
  los cuatro pilares. El descanso abre el camino porque prepara energia, atencion y disposicion para
  alimentarse, moverse y relacionarse mejor, sin declarar que un pilar sustituye a los demas.

## Principios de psicologia y gamificacion

### Identidad antes que resultado

El reto no promete curar insomnio ni «crear un habito en siete dias». La identidad que refuerza es:

> Soy una persona que protege su descanso.

Se celebra la conducta que la persona controla, nunca horas dormidas, peso, calorias ni un resultado
clinico. Cada repeticion es evidencia de esa identidad.

### Las cuatro leyes llevadas a la interfaz

| Ley | Decision de producto |
|---|---|
| Hacerlo obvio | El ritual tiene dos anclas: cerrar la noche y abrir la manana. |
| Hacerlo atractivo | El pilar crece visualmente de Semilla a Brote y la comunidad puede reconocerlo. |
| Hacerlo facil | Existe una version minima; el ritual completo es una invitacion, no un examen. |
| Hacerlo satisfactorio | La primera repeticion recibe una celebracion inmediata, puntos y progreso visible. |

### Recompensa desde el primer dia

La intensidad no es plana:

| Momento | Respuesta |
|---|---|
| Primera repeticion | Celebracion personal fuerte; Semilla a Brote; publicacion opcional. |
| Repeticion normal | Microcelebracion breve y personal. |
| Regreso despues de faltar | Celebracion especial: volver vale mas que fingir perfeccion. |
| Mitad del reto | Crecimiento visual e insignia intermedia. |
| Final | Celebracion maxima, resumen, insignia permanente y publicacion final opcional. |

Una racha nunca vuelve todo a cero. La regla narrativa es **no faltar dos veces**, y el producto
premia regresar. El objetivo semanal sera 5 de 7, no 7 de 7 obligatorio.

### Gamificacion etica

- 10 puntos por ciclo valido, con un maximo por ciclo; caminar mas o dormir mas no compra mas puntos.
- Semilla, Brote, Raiz y Cosecha representan practica acumulada, no superioridad personal.
- Las reacciones sociales no dan puntos: la salud no se convierte en concurso de popularidad.
- No hay castigos, miedo, recompensas economicas, comparacion corporal ni notificaciones infinitas.
- La clasificacion, si llega, compara constancia relativa en ligas pequenas y reiniciadas, no volumen
  de ejercicio ni historiales eternos.

## El primer ritual

### Nombre y promesa

**Del atardecer al amanecer:** construir un ritual que prepare la noche y active la manana.

No se fija «tomar el sol a las 6 p. m.»: la luz disponible cambia con lugar y temporada. La tarde
puede incluir salir a luz natural si todavia la hay; la senal principal es salir al exterior durante
la primera hora despues de despertar, sin mirar directamente al sol.

### Cadena completa

1. Cenar con anticipacion suficiente para la propia rutina.
2. Dejar preparada la ropa para caminar, correr o hacer el movimiento que la persona pueda.
3. Estacionar los dispositivos fuera del alcance.
4. Bajar la intensidad de las luces.
5. Preparar un cuarto oscuro, tranquilo y fresco.
6. Acostarse dentro de una ventana elegida y sostener una hora de despertar razonablemente estable.
7. Salir a luz natural al despertar.
8. Caminar, correr o moverse segun capacidad.

### Minimo que cuenta en el primer slice

- **Cerrar la noche:** dispositivos estacionados y luces bajas.
- **Abrir la manana:** salir a luz natural exterior al despertar.

Cena, ropa, ambiente y movimiento se muestran como pasos recomendados. No completarlos no convierte
el dia en fracaso. El movimiento tampoco se prescribe con intensidad: debe admitir distintas
capacidades y condiciones.

## Modelo acordado

### La definicion vive en codigo; el progreso, en datos

El reto y sus textos son curados por Hazlo Sano y versionados junto al producto. No se crea un CMS ni
una tabla configurable de retos para un solo caso. La persistencia usa una clave estable
`sleep-evening-to-morning-v1`, de modo que los siguientes pilares puedan compartir el mecanismo sin
convertir esta primera entrega en un constructor generico.

El modelo minimo tiene dos conceptos:

- **Progreso privado:** una fila por persona y reto; empezar y completar el primer ciclo son
  idempotentes. La sesion decide la persona: ningun `userId` llega desde el navegador.
- **Celebracion publica:** existe solo cuando la persona acepta compartir un hito. Es separada del
  progreso para que privado sea el default y retirar el consentimiento quite la proyeccion publica
  sin borrar el logro personal.

Las celebraciones **no son publicaciones**. Meterlas en `posts` las enviaria por error a busqueda,
embeddings, RSS, sitemap, categorias, carrito y reportes. El inicio compone una tarjeta de celebracion
acotada antes de `PostsWithLoadMore`; la paginacion de publicaciones permanece intacta.

### Identidad y privacidad

- Leer el ritual es publico; registrar progreso requiere sesion para que sobreviva entre dispositivos.
- Compartir es opt-in despues de cumplir, nunca una casilla premarcada.
- Se usa la identidad publica que la persona ya haya reclamado. Sin nombre publico se muestra
  «Una persona de la comunidad»; nunca correo ni datos del ritual.
- Lo compartido dice que completo una repeticion o un reto, no a que hora durmio ni que dias fallo.
- La persona puede retirar la celebracion; su progreso privado no cambia.

### Mensaje para todo el sitio

La celebracion publica mas reciente produce dos proyecciones del mismo evento:

1. Una tarjeta acotada antes de las publicaciones del inicio.
2. Un mensaje global descartable bajo la cabecera, visible en cualquier pagina.

No se insertan copias por usuario ni se construye un centro de notificaciones. Una cookie guarda el
id del ultimo mensaje cerrado en ese navegador. Cuando hay una celebracion mas nueva vuelve a
aparecer. Este mecanismo tambien alcanza a visitantes sin cuenta.

## Slice roadmap

### Slice 1 - Mi primer ciclo de descanso *(completado)*

**Alcance**

- Ruta `/habitos/sueno` y `/en/habits/sleep`, con metadata y enlace desde el pilar Sueno.
- Explicacion del ritual completo y distincion visible entre minimo y recomendado.
- Inicio con sesion; quien no ha entrado vuelve al reto despues de identificarse.
- Registro idempotente de la primera repeticion autorreferida.
- Celebracion inmediata: 10 puntos, insignia Primer paso y Semilla que se convierte en Brote.
- Consentimiento separado para compartir o retirar el primer hito.
- Ultima celebracion publica antes del feed y mensaje global descartable.
- Migracion Alembic aditiva en el backend que gobierna el esquema; Drizzle solo refleja las tablas.

**Criterios de aceptacion**

1. El reto explica las dos acciones minimas y deja cena, ropa, ambiente y movimiento como recomendadas.
2. Sin sesion, iniciar lleva a entrar y conserva el destino de regreso.
3. Con sesion, completar ambos anclajes una vez deja 10 puntos y nivel Brote; repetir la peticion no suma.
4. Antes de compartir no aparece nombre ni logro en el inicio ni en el mensaje global.
5. Al compartir, una sola tarjeta aparece antes de la primera publicacion y un mensaje se ve en todo
   el sitio; cerrarlo lo oculta en ese navegador.
6. Retirar la celebracion elimina ambas proyecciones pero conserva el Brote y los 10 puntos privados.
7. Espanol e ingles conservan rutas, contenido y regreso de autenticacion en su idioma.

### Slice 2 - Siete dias y una celebracion final *(completado)*

- Ventana local de siete dias bajo contrato `[inicio, fin)` y ciclos asignados a la fecha local de la
  manana que los cierra, porque el sueno cruza medianoche. La zona IANA se captura al iniciar y el
  reloj se inyecta para que los limites sean comprobables sin depender del servidor.
- Progresion del ritual: dispositivos y luces; ropa y ambiente; luz matutina; movimiento.
- Objetivo 5 de 7, microcelebraciones variables y bonus narrativo por regresar.
- Celebracion final claramente superior, insignia persistente y segundo hito publico opcional.
- Nunca se afirma que siete dias bastan para formar un habito.

**Criterios de aceptacion**

1. Cada fecha local admite una sola repeticion y cada repeticion vale 10 puntos; reintentos no suman.
2. Se pueden registrar fechas anteriores aun disponibles dentro de la ventana, nunca fechas futuras
   ni fechas fuera de `[inicio, fin)`.
3. La interfaz muestra el ciclo y el dia de siete, conserva avances al faltar y reconoce el regreso
   posterior a una fecha sin repeticion.
4. Cinco fechas distintas completan el reto, otorgan Cosecha e insignia persistente y muestran una
   celebracion final mas fuerte sin prometer que ya se formo un habito.
5. El hito final permanece privado hasta compartirlo y puede retirarse sin alterar ciclos, puntos ni
   insignias.

### Slice 3 - Jardin comunitario y apoyo *(completado)*

- Cada repeticion compartida hace crecer un jardin agregado con los colores de los cuatro pilares.
- Reaccion unica «Celebrar», sin puntos ni ranking de popularidad.
- Los hitos intermedios se agrupan para que el sitio no emita una alerta por persona y por dia.
- Grupos empiezan solo cuando exista una forma real de crearlos; un logro grupal produce un evento,
  no uno por integrante.

**Criterios de aceptacion**

1. Aportar repeticiones al jardin es un consentimiento agregado y revocable, separado de publicar
   un hito con nombre.
2. El jardin muestra conteos por los cuatro pilares y nunca ordena personas.
3. `Celebrar` usa intenciones explicitas de agregar o retirar; repetir la misma intencion no cambia
   el conteo y cada cuenta ocupa como maximo una reaccion por celebracion.
4. Las reacciones no cambian los puntos del autor y las repeticiones intermedias solo alteran el agregado,
   no el mensaje global.
5. Sin modelo real de grupos se explica que aun no existen; no se inventan equipos ni actividad.

### Slice 4 - Los otros pilares y recordatorios *(completado)*

- Retos atomicos curados para alimentacion, movimiento y mente/comunidad.
- Los cuatro rituales pueden avanzar simultaneamente. La exclusividad inicial de onboarding fue
  reemplazada por el modelo de `docs/features/wellbeing/012-2026-08-12-rituales-concurrentes.md`.
- Recordatorios por Telegram en el momento elegido, condicionados a comprobar que `external_id`
  identifica el chat correcto y a consentimiento separado.

**Hallazgo medido sobre Telegram**

El backend documenta y usa `users.external_id` como identificador agnostico del canal: puede ser
telefono de WhatsApp, id de Telegram, Instagram o Messenger. El orquestador busca usuarios solo por
ese valor aunque `messages.channel` si se guarda aparte. Existe `MessagingService.send_message` y un
`TelegramClient`, pero no una vinculacion persistida `user + channel + external_id` que demuestre que
la cuenta web corresponde al chat de Telegram. Por tanto este slice no envia recordatorios ni guarda
un opt-in enganoso: muestra la elegibilidad bloqueada y la condicion concreta que falta.

**Criterios de aceptacion**

1. Alimentacion, movimiento y mente/comunidad tienen definicion curada, ruta y contenido bilingue,
   enlazados desde su pilar.
2. Activar una practica desactiva solo el onboarding de la anterior; no borra sus repeticiones ni puntos.
3. Cada practica usa la persistencia generica de progreso/repeticiones y una repeticion diaria topada.
4. La interfaz explica que Telegram no esta disponible porque la identidad de canal no esta probada;
   no ofrece elegir hora ni afirma haber enviado nada.

### Slice 5 - Ligas semanales condicionadas *(completado)*

No se construye hasta tener suficientes participantes semanales para que cada liga tenga al menos
10 personas activas. Seran opt-in, por alias, reiniciadas cada semana, con empates compartidos y
puntos topados por dia. La posicion mide cumplimiento del propio minimo, nunca minutos, pasos,
calorias, peso ni horas de sueno.

**Criterios de aceptacion**

1. Elegibilidad exige al menos diez cuentas con opt-in y una repeticion dentro de la semana actual.
2. Cada fecha distinta vale como maximo un punto aunque haya repeticiones en varios pilares; la
   semana se reinicia bajo `[lunes UTC, lunes UTC siguiente)`.
3. El ranking usa alias reclamado, comparte posicion en empates y no considera minutos, volumen,
   calorias, peso ni horas dormidas.
4. Con menos de diez se muestra avance colectivo hacia el umbral y nunca una tabla vacia.
5. El opt-in es revocable; sin alias publico se explica el requisito en vez de exponer nombre o email.

### Slice 6 - Alimentacion con la profundidad de Sueno *(completado)*

El reto generico «Una planta mas» adopta la misma gramatica de producto que hizo valioso al ritual de
descanso, sin copiar su noche ni su estetica:

- **Identidad:** «Soy una persona que hace facil elegir comida real».
- **Senal:** elegir una comida cotidiana como ancla, no esperar a tener motivacion o una dieta perfecta.
- **Preparacion:** dejar visible, lavado o porcionado un alimento vegetal minimamente procesado.
- **Minimo:** sumar ese alimento a la comida ancla. No se cuentan calorias, peso ni cantidad.
- **Ritual que crece:** elegir, hacer visible, preparar, sumar y observar que combinacion resulto facil.
- **Diseno:** atmosfera calida de cocina/mercado con los tokens naranjas de Alimentacion; hoja y plato
  como simbolos, no la luna, el cielo ni la semilla violeta de Sueno.
- **Semana:** calendario local 7 dias, meta 5/7, 10 puntos por fecha distinta, regreso sin reinicio,
  celebracion inmediata y celebracion final propia.
- **Comunidad:** hitos, tarjeta, mensaje global, jardin y reaccion enlazan y nombran Alimentacion, no
  reutilizan texto ni destino de Sueno.

**Criterios de aceptacion**

1. La ruta explica senal, preparacion y minimo antes de pedir registrar nada.
2. Un check-in exige haber elegido la comida ancla y sumado una planta; prepararla con anticipacion es
   recomendada, no una puerta para considerar el dia fracasado.
3. Cinco fechas locales distintas producen 50 puntos, nivel Cosecha y la celebracion
   «Cultivaste cinco elecciones reales».
4. La celebracion publica usa el color, texto y enlace de Alimentacion y sigue siendo opt-in/revocable.
5. El calendario, privacidad, puntos, jardin y liga salen de una base compartida, no de una segunda copia
   del panel de Sueno.

### Slice 7 - Movimiento con ritual propio *(completado)*

- **Identidad:** «Soy una persona que empieza a moverse».
- **Senal:** vincular el inicio a ropa preparada, una pausa o una ruta cotidiana.
- **Minimo:** dos minutos de movimiento segun capacidad; continuar es opcional y no da puntos extra.
- **Ritual:** preparar, ponerse de pie, empezar dos minutos y reconocer como se siente el cuerpo.
- **Diseno:** energia y direccion con el verde oficial de Movimiento, trazos de recorrido y pulso.
- Misma semana 5/7, celebraciones y comunidad, con textos y destinos propios.

### Slice 8 - Mente y Comunidad con ritual propio *(completado)*

- **Identidad:** «Soy una persona que cultiva vinculos reales».
- **Senal:** una pausa cotidiana que recuerde mirar fuera del ruido digital.
- **Minimo:** enviar un mensaje de presencia real a una persona y dejar espacio para escuchar o
  responder sin convertir la reaccion ajena en requisito.
- **Ritual:** pausar, elegir, contactar, escuchar y agradecer.
- **Diseno:** atmosfera de encuentro con los tokens oficiales de Mente/Espiritu y circulos que se
  conectan.
- Misma semana 5/7, celebraciones y comunidad, sin puntuar popularidad ni cantidad de respuestas.

### Slice 9 - Una invitacion clara y textos cotidianos *(completado)*

**Problema:** En Alimentacion, Movimiento y Mente/Comunidad la invitacion a empezar queda escondida
despues de las referencias. Ademas, el indice y las experiencias explican algunas decisiones con
palabras internas como «reto atomico», «onboarding», `external_id` o «puerto de envio».

**Ahorro:** La persona encuentra antes el siguiente paso y entiende la propuesta sin tener que
descifrar como esta construido el producto.

**Por que:** Cada pilar debe llevar de la evidencia a una accion sencilla. La interfaz explica que
hacer y que puede esperar; los detalles tecnicos pertenecen al codigo y a la documentacion.

**Alcance**

- Sueno queda como referencia: invitacion centrada antes de las referencias.
- Alimentacion, Movimiento y Mente/Comunidad mueven su invitacion al mismo lugar.
- El indice y las cuatro experiencias eliminan menciones visibles a «retos atomicos» y detalles
  internos de vinculacion, puertos u onboarding.
- Se simplifican las frases largas o abstractas sin cambiar meta 5/7, puntos, privacidad, seguridad,
  recordatorios no disponibles ni reglas de registro.
- Espanol e ingles conservan la misma estructura de catalogo y el mismo significado.

**Criterios de aceptacion**

1. En los cuatro pilares, la invitacion esta centrada y aparece antes del titulo «Referencias».
2. Las rutas de retos no muestran «atomico/atomic», `external_id`, «puerto/sending port» ni
   «onboarding».
3. El recordatorio sigue deshabilitado, pero solo informa que todavia no esta disponible.
4. Los textos explican acciones y resultados con frases directas; no exponen decisiones de
   arquitectura.
5. Articulos, referencias cientificas y reglas de negocio permanecen intactos.

### Slice 10 - Mente y Espiritu comparte ruta y color con su pilar *(completado)*

**Problema:** El pilar se llama Mente y Espiritu y vive en `/pilares/mente-espiritu`, pero su practica
usa «mente-comunidad» en la URL y colores ambar escritos a mano. La navegacion y la identidad visual
parecen pertenecer a dos conceptos distintos.

**Ahorro:** Una correspondencia directa evita dudas al compartir enlaces y elimina el riesgo de que
el color del reto diverja cuando cambie la paleta oficial del pilar.

**Por que:** Cada practica debe ser una continuacion reconocible de su pilar, no una experiencia
paralela con otro nombre o paleta.

**Alcance**

- La ruta canonica pasa a `/habitos/mente-espiritu` en espanol y `/en/habits/mind-spirit` en ingles.
- Invitaciones, indice, acciones, celebraciones, sitemap, calentamiento y pruebas apuntan solo a la
  ruta nueva. No se conserva un alias porque la funcionalidad aun no se ha publicado.
- Hero, tarjetas, calendario, controles y celebraciones usan exclusivamente
  `pillar-mind-spirit-ink`, `pillar-mind-spirit-soft` y `pillar-mind-spirit-solid`.
- El identificador interno `mind-one-connection-v1` y las reglas de progreso no cambian.

**Criterios de aceptacion**

1. Seguir el CTA desde Mente y Espiritu abre la ruta canonica correspondiente al idioma activo.
2. Ningun enlace, sitemap o prueba conserva «mente-comunidad» o «mind-community».
3. La experiencia profunda, el panel y la celebracion publica no contienen clases `amber-*`.
4. Las tres superficies usan los mismos tokens que `pillarColorClasses.mindSpirit`.
5. Copy, progreso, puntos, privacidad y reglas del vinculo permanecen intactos.

### Slice 11 - El progreso se expresa como puntos *(completado)*

**Problema:** La interfaz muestra «XP», una abreviatura asociada a videojuegos que no todas las
personas reconocen.

**Ahorro:** «Puntos» comunica el progreso sin obligar a descifrar una sigla.

**Por que:** Los retos deben usar palabras cotidianas y accesibles, especialmente al explicar salud y
constancia.

**Alcance**

- Espanol muestra «puntos» e ingles «points» en progreso, avisos, celebraciones y privacidad.
- Gherkin, pruebas de componentes y expectativas Playwright usan el texto visible nuevo.
- El campo interno `xp`, sus calculos y los contratos persistidos no cambian.
- No hay migracion, recuento nuevo ni transformacion de datos.

**Criterios de aceptacion**

1. Cero, una y cinco repeticiones muestran 0, 10 y 50 puntos respectivamente.
2. La interfaz no muestra «XP» ni «EXP» en ninguno de los dos idiomas.
3. Reintentos y volumen adicional siguen sin sumar puntos.
4. El valor interno continua calculandose como `xp` para evitar cambios sin valor en dominio y base.

### Gramatica compartida, identidad distinta

Los cuatro retos comparten estructura, no contenido: hero inmersivo, declaracion de identidad, senal,
accion minima, cadena que crece, advertencia responsable, calendario, puntos y celebraciones. La
implementacion extraera calendario, check-in, recompensas y consentimiento hacia presentacion de
habitos; cada reto entregara su configuracion cerrada de textos, iconos y tokens. No se importa UI
entre rutas ni se crean cuatro copias que diverjan.

## Medicion

El embudo que decide los siguientes slices es:

1. Visita al reto desde el pilar Sueno.
2. Inicio con sesion.
3. Primera repeticion.
4. Tercera repeticion dentro de la semana activa.
5. Finalizacion 5 de 7.
6. Consentimiento para compartir y reacciones recibidas.

La senal principal no es cuantos se inscriben, sino cuantos vuelven al menos tres veces. Una tabla de
posiciones no se justifica por usuarios registrados, sino por participantes semanales reales.

## Fuera del roadmap entregado

Notificaciones push, horarios medicos, sensores, integracion con wearables, comentarios libres y
grupos sin una entidad, membresia y gobernanza reales. Telegram permanece condicionado a una
vinculacion verificable entre cuenta, canal e identidad; la clasificacion permanece oculta hasta
alcanzar diez participantes semanales activos. Tampoco se diagnostica, prescribe ni reemplaza
atencion profesional.

## Riesgos y decisiones

| Riesgo | Respuesta |
|---|---|
| Un doble toque suma dos ciclos | Escritura condicional y unicidad en base; la intencion es idempotente. |
| Compartir expone salud | Solo se publica el hito, por consentimiento posterior y revocable. |
| La celebracion invade el feed | Solo la ultima va fijada; no entra a `posts` ni a su paginacion. |
| El aviso se vuelve ruido | Primera accion y final; lo intermedio se queda personal o agregado. |
| La gamificacion premia exceso | Puntos topados por ciclo y ninguna recompensa por volumen. |
| El reto cruza medianoche | El slice 2 acuerda zona local y rangos `[inicio, fin)` antes de rachas. |
| La tabla nueva afecta al bot | Migracion Alembic aditiva; ningun contrato existente cambia. |

## Pruebas

- **Dominio/Vitest:** pasos minimos, puntos, transicion Semilla a Brote, idempotencia y visibilidad por
  consentimiento.
- **Use cases/Vitest:** sesion resuelta fuera del caso de uso, puertos falsos y doble envio.
- **Componentes/Vitest:** ritual, celebracion y mensaje global con `renderWithIntl`.
- **Playwright:** recorrido de primera repeticion, privacidad por defecto, compartir, fijar antes del
  feed, cerrar el aviso y retirar.
- **Integracion real:** repositorio PostgreSQL y limpieza exacta de las filas de la cuenta E2E.
