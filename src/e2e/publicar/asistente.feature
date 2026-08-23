# language: es
Característica: Saber por dónde voy al publicar

  Como alguien que está llenando el formulario de publicar
  Quiero ver cuánto llevo y cuánto me falta
  Para decidir si termino ahora o lo dejo para luego

  Antecedentes:
    Dado que inicié sesión
    Y que abrí "/publicar"

  Escenario: La barra de pasos ocupa el ancho del formulario
    Entonces la barra mide lo mismo que la columna donde escribo

  Escenario: Los tres tramos se reparten ese ancho
    Entonces ningún tramo es más largo que otro
    Y ninguno es un punto suelto
