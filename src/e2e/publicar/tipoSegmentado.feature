# language: es
Característica: Elegir qué publico viendo todas las opciones

  Como alguien que va a publicar algo sano
  Quiero ver de una vez si esto es un producto, un evento, un servicio o un aviso
  Para no descubrir a medias que el formulario me pedía otra cosa

  Antecedentes:
    Dado que inicié sesión
    Y que abrí "/publicar"

  Escenario: Las cuatro opciones están a la vista
    Entonces veo "Producto", "Evento", "Servicio" y "Anuncio" sin desplegar nada

  Escenario: Elegir un tipo cambia qué me piden
    Dado que no me piden una fecha
    Cuando elijo "Evento"
    Entonces me piden cuándo ocurre

  Escenario: Se ve cuál elegí
    Cuando elijo "Producto"
    Entonces esa opción se ve distinta de las que no elegí

  Escenario: Puedo elegir con el teclado
    Dado que elegí "Producto"
    Cuando pulso la flecha derecha
    Entonces queda elegido "Evento"
