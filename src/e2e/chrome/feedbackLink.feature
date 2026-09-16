# language: es
Característica: Un enlace para dar retro sin salir del sitio

  Contexto:
  - Problema: no hay dónde proponer una idea o reportar un error sin salir del flujo del sitio o
    buscar el WhatsApp de la comunidad de memoria.
  - Ahorro: reutiliza el WhatsApp que ya existe —el mismo número que ya usa el pie—, con un mensaje
    ya escrito, así que cuesta un clic y no una búsqueda.
  - Por qué: cuantas más ideas y errores lleguen, mejor decide el equipo qué construir después.

  Como cualquiera que usa el sitio
  Quiero un atajo visible para dar mi opinión
  Para no tener que buscar cómo contactar a Hazlo Sano

  Antecedentes:
    Dado que abro el sitio

  @slice-1
  Escenario: El icono está en el header de escritorio, junto al carrito
    Dado una ventana de escritorio
    Cuando miro la cabecera
    Entonces veo un icono de retroalimentación
    Y su nombre accesible es "¿Qué te hace falta?"
    Y abre WhatsApp con el mensaje ya escrito

  # La barra inferior del teléfono ya tiene sus cinco lugares fijos (inicio, buscar, publicar,
  # catálogo, cuenta); el atajo no le quita uno ni le suma un sexto.
  @slice-1
  Escenario: En el teléfono vive en el menú, no en la barra inferior
    Dado una ventana de teléfono
    Cuando abro el menú de hamburguesa
    Entonces veo la fila "¿Qué te hace falta?"
    Y la barra inferior sigue con sus cinco lugares de siempre

  @slice-1
  Escenario: El pie también lo ofrece, distinto del WhatsApp de contacto
    Cuando bajo hasta el pie
    Entonces veo el enlace "¿Qué te hace falta?" que abre WhatsApp con el mensaje ya escrito
    Y sigue estando el enlace de WhatsApp de contacto de siempre
