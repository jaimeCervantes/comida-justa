Feature: La búsqueda de una tienda entiende palabras sueltas

  Context:
  - Problem: el buscador del catálogo de una tienda y el del panel de inventario buscan la frase
    entera, tal como se escribió. «masa madre» encuentra el pan, pero «canela masa», «madr canel» o
    «proteina» sin acento no encuentran nada aunque el producto esté ahí. Los demás buscadores del
    sitio ya entienden palabras sueltas, a medias y sin acentos.
  - Savings: quien viene a comprar escribe el nombre como lo recuerda y lo encuentra, en vez de
    creer que la tienda no lo vende. Quien administra encuentra lo suyo sin adivinar el título.
  - Why: que todos los buscadores del sitio entiendan lo mismo.

  As a visitante de una tienda, o quien la administra
  I want to encontrar un producto escribiendo las palabras que recuerdo
  So that no tenga que adivinar el orden ni los acentos del título

  # Los títulos son del catálogo real de Hazlo Sano (2026-10-20), sembrados en una tienda de prueba.
  Background:
    Given una tienda con estos productos, publicados en este orden:
      | título                                          |
      | Proteína de Soya Aislada \| Prosoy 90% 250 g     |
      | Pan de masa madre de canela                     |
      | Agua de piña con pepino                         |
      | Barra de Proteína Sabor Moka — Pieza individual |

  @slice-1
  Scenario Outline: Encuentro el producto con las palabras que recuerdo
    When un visitante busca "<escrito>" en el catálogo de la tienda
    Then el catálogo muestra solo "<encuentra>"

    Examples: lo que ya encontraba sigue encontrándolo
      | escrito    | encuentra                   | por qué                                  |
      | masa madre | Pan de masa madre de canela | la frase tal cual, como antes            |

    Examples: lo que antes no encontraba
      | escrito     | encuentra                   | por qué                                 |
      | canela masa | Pan de masa madre de canela | en cualquier orden                      |
      | madr canel  | Pan de masa madre de canela | a medias                                |
      | pina        | Agua de piña con pepino     | sin ñ                                   |
      | SOYA        | Proteína de Soya Aislada \| Prosoy 90% 250 g | sin mayúsculas      |

  @slice-1
  Scenario: Todas las palabras, no cualquiera
    When un visitante busca "canela pepino" en el catálogo de la tienda
    Then el catálogo dice que no hay nada con esa búsqueda
    # Ningún título tiene las dos. Con «cualquiera» saldrían el pan y el agua, y buscar más
    # palabras traería más resultados en vez de menos.

  @slice-1
  Scenario: Primero lo que empieza con la primera palabra
    When un visitante busca "proteina" en el catálogo de la tienda
    Then el catálogo muestra, en este orden:
      | título                                          |
      | Proteína de Soya Aislada \| Prosoy 90% 250 g     |
      | Barra de Proteína Sabor Moka — Pieza individual |
    # Sin buscar, la barra va primero por ser la más reciente.

  @slice-1
  Scenario: En el panel de inventario, igual
    Given soy quien administra la tienda
    When escribo "canela masa" en el buscador del panel de inventario
    Then la tabla se queda solo con "Pan de masa madre de canela"
