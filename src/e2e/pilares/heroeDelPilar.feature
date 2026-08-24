# language: es
Característica: La primera pantalla de un pilar ofrece algo que hacer

  Es la anotación número uno del 5.6 del canvas: «el pilar deja de ser una página de texto; su
  primera pantalla ofrece una acción en vez de explicar el concepto».

  La práctica y lo que hay cerca ya vivían en la página, pero detrás del artículo entero: quien
  llegaba convencido tenía que recorrérselo para encontrar dónde empezar.

  Como alguien que abre un pilar decidido a probar algo
  Quiero poder empezar desde arriba
  Para no leerme el artículo entero antes de encontrar la práctica

  Escenario: El héroe lleva a la práctica y a lo que hay cerca
    Dado que abro un pilar
    Entonces su héroe ofrece empezar la práctica
    Y ofrece ver lo que hay cerca
    Y las dos llevan a secciones que existen en esa misma página

  # «El número acompaña siempre al violeta», y no es decoración: Movimiento y Mente contrastan 1.14
  # entre sí como tinta, así que el color por sí solo no distingue un pilar de otro.

  Escenario: El héroe dice de qué pilar se trata, con número y no solo con color
    Dado que abro un pilar
    Entonces su héroe enseña su número
    Y dice cuál de los cuatro es

  # El canvas rotula ese botón «Adoptar un hábito». Este producto se niega en su propia redacción a
  # afirmar que alguien formó un hábito, así que prometerlo en la primera pantalla se contradiría.

  Escenario: La invitación no promete un hábito
    Dado que abro un pilar
    Entonces el héroe habla de práctica
    Pero no promete que vaya a formar un hábito
