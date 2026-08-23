# language: es
Característica: Saber qué hacer al entrar en los cuatro pilares

  Como alguien que llega a /pilares por curiosidad
  Quiero ver qué práctica corresponde a cada pilar
  Para no salir con cuatro conceptos y ninguna cosa que hacer

  Antecedentes:
    Dado que abrí "/pilares"

  Escenario: Cada pilar enseña su práctica
    Entonces las cuatro tarjetas nombran la práctica que les toca
    Y cada nombre coincide con el que se lee dentro de ese pilar

  Escenario: El jardín cuenta sin señalar a nadie
    Entonces veo los cuatro canteros con su número
    Y la nota de privacidad está a la vista

  # El 5.10 del canvas abre y cierra con la misma acción: «Elegir mi práctica». La página tenía las
  # dos veces escritas en el catálogo —`habitCommunity.invitation`— sin que las pintara nadie.

  Escenario: El héroe ofrece algo que hacer, no solo qué leer
    Entonces el héroe invita a elegir una práctica
    Y esa invitación lleva a las cuatro tarjetas de la misma página

  Escenario: La página cierra invitando a practicar
    Cuando llego al final de la lista
    Entonces me encuentro «Tu turno» antes de la explicación de por qué son cuatro
    Y su invitación lleva al mismo sitio que la de arriba

  # «Meta 5 de 7 días» es lo que decía el canvas, y dejó de ser cierto cuando la meta se volvió
  # proporcional: quien se suma un domingo tiene un día. La promesa de que leer no pide cuenta sí
  # sigue en pie, y es la mitad que importa en una portada.

  Escenario: La portada no promete una meta que no siempre es esa
    Entonces la nota del héroe dice que leer no pide cuenta
    Pero no afirma un número fijo de días
