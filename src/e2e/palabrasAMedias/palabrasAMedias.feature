Feature: La búsqueda entiende palabras a medias

  Context:
  - Problem: la caja del header busca mientras se escribe, pero solo reconoce palabras completas.
    «prote», «galle» o «barra de prot» se quedan sin resultados aunque haya decenas de proteínas,
    galletas y barras. Y el registro de búsquedas cuenta como fallida cada vez que alguien pica un
    pilar vacío, así que «pan» parecía no encontrar nada cuando da 29 resultados.
  - Savings: quien busca encuentra el producto antes de terminar de escribir, en vez de irse con
    «no hay resultados» de algo que sí existe. Y la medición cuenta solo a quien de verdad se fue
    sin nada.
  - Why: la búsqueda es la puerta principal del catálogo. Cada búsqueda vacía de algo que existe es
    una venta que se pierde en el primer paso.

  As a visitante que busca un producto
  I want to encontrarlo aunque no termine de escribir la palabra
  So that no me vaya creyendo que no lo venden

  # Los ejemplos son de la base real (2026-10-17). El primer resultado puede cambiar si se
  # publica algo nuevo; lo que no cambia es la regla: sus palabras empiezan con lo escrito.
  @slice-1
  Scenario Outline: Encuentro el producto aunque no termine de escribir la palabra
    When busco "<escrito>"
    Then el primer resultado tiene palabras que empiezan con "<inicios>"
    # Hoy, por ejemplo, es «<hoy>».

    Examples:
      | escrito       | inicios    | hoy                                         |
      | prote         | prot       | Proteína de Soya Aislada                    |
      | galle         | gall       | Galletas Mini Doble Chocolate               |
      | barra de prot | barr, prot | Barrita Wild Protein Pro Cinnamon Roll      |

  @slice-1
  Scenario: Una palabra completa no se abre a las que solo empiezan igual
    Given una publicación «E2E Galletas de qorvanex» y otra «E2E Barra qorvanextrel»
    When busco "qorvanex"
    Then veo «E2E Galletas de qorvanex»
    And no veo «E2E Barra qorvanextrel»

  @slice-1
  Scenario: El inicio de la palabra encuentra las dos
    Given una publicación «E2E Galletas de qorvanex» y otra «E2E Barra qorvanextrel»
    When busco "qorvan"
    Then veo las dos

  @slice-1
  Scenario: Un pilar sin ese producto no cuenta como búsqueda fallida
    Given busqué "pan"
    When elijo el pilar "Mente"
    Then no veo ningún resultado
    # Lo cubre SearchPostsUseCase.test.ts: el registro no tiene marcador de corrida y en la base
    # compartida buscan «pan» personas de verdad.
    And esa búsqueda no queda registrada como búsqueda sin resultados
