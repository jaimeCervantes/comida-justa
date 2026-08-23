# language: es
Característica: Ver lo que estoy publicando mientras lo escribo

  Como alguien que va a publicar algo sano
  Quiero ver la tarjeta que va a quedar y qué me falta
  Para no tener que publicar a ciegas y corregir después

  Antecedentes:
    Dado que inicié sesión
    Y que abrí "/publicar" en una pantalla de escritorio

  Escenario: El título que escribo aparece en la tarjeta de al lado
    Cuando escribo "Miel cruda de azahar · 500 g" en el título
    Entonces la vista previa muestra ese mismo texto

  Escenario: El pilar que elijo se ve con su número
    Cuando elijo la categoría "Alimentación"
    Entonces la vista previa muestra "Alimentación" con el número 2

  Escenario: El checklist tacha lo que ya llené
    Dado que el punto del título está pendiente
    Cuando escribo un título y elijo un pilar
    Entonces los puntos del título y del pilar quedan hechos
    Y el de la foto sigue pendiente, marcado como recomendado

  Escenario: Un punto pendiente me lleva a su campo
    Cuando pulso el punto "Cómo te contactan"
    Entonces el asistente salta al paso que contiene el teléfono
    Y el cursor queda dentro del campo de teléfono

  Escenario: El resumen cambia cuando ya no falta nada obligatorio
    Dado que el resumen dice cuántas cosas faltan
    Cuando lleno el título, el pilar, el teléfono y la descripción
    Entonces el resumen deja de decir lo mismo
    Y la foto sigue pendiente, porque recomendada no es obligatoria
