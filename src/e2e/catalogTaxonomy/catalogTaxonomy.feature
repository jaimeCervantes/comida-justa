Feature: Centralised catalog taxonomy
  Move the category taxonomy into the shared database, so the three repositories that read that
  database read the same thing instead of keeping three hand-maintained copies. Categories and
  sub-categories live in one self-referencing table; labels live per locale in another.

  Context:
  - Problem: the taxonomy is tripled by hand and nothing forces the copies to agree. This repo holds
    the typed keys and the es/en labels, the Telegram mini-app holds a Spanish-only manual mirror,
    and the Python bot treats the value as an opaque string. On top of that, posts.category and
    posts.sub_category are free `text` with no FK and no CHECK, and the category→sub-category
    hierarchy is modelled nowhere: nothing states that `jugos` belongs to `alimentacion`.
  - Savings: renaming a key stops being three coordinated PRs and becomes one UPDATE. Above all the
    failure stops being silent — today a stale key breaks nothing, it just makes the label vanish or
    render raw, and it is found weeks later while looking at data.
  - Why: the catalog is meant to grow with what the community publishes, and the taxonomy with it.
    Three copies synchronised by hand do not scale past the 7 keys that exist today.

  As Hazlo Sano
  I want one source of truth for categories, hierarchical and translated
  So that renaming or adding a category is a database change, not three code changes

  Background:
    Given the app is running with PostgreSQL as the database
    And the catalog holds one root category and six sub-categories:
      | key          | parent_key   | level | sort_order | label es     | label en  |
      | alimentacion |              | 1     | 10         | Alimentación | Food      |
      | jugos        | alimentacion | 2     | 10         | Jugos        | Juices    |
      | platillos    | alimentacion | 2     | 20         | Platillos    | Dishes    |
      | bebidas      | alimentacion | 2     | 30         | Bebidas      | Drinks    |
      | panaderia    | alimentacion | 2     | 40         | Panadería    | Bakery    |
      | abarrotes    | alimentacion | 2     | 50         | Abarrotes    | Groceries |
      | untables     | alimentacion | 2     | 60         | Untables     | Spreads   |

  # ---------------------------------------------------------------------------
  # Slice 1 — the taxonomy lives in the database
  # Alembic: 0026_2026-07-28_centralize_catalog_taxonomy.py (bot-whatsapp/backend)
  # Domain covered by Vitest: src/domain/entities/post/taxonomy.test.ts
  # Cache/fallback covered by Vitest:
  #   src/infra/dataAccess/catalog/PostgresCatalogRepository.test.ts
  # No consumer changes behaviour in this slice: category.ts, the label module and
  # CategoryTag are untouched and still drive the UI.
  # ---------------------------------------------------------------------------

  # The migration must be a no-op over real data. `posts` was verified clean before writing it:
  # 14 products, all category='alimentacion', 0 keys outside the allowlist, 0 orphan sub-categories.
  @slice-1
  Scenario: The migration adds the constraints without touching a single product
    Given the 14 published products distributed as:
      | sub_category | products |
      | bebidas      | 4        |
      | platillos    | 4        |
      | panaderia    | 3        |
      | untables     | 2        |
      | jugos        | 1        |
    When the migration runs
    Then every product passes the new foreign keys
    And no row of posts is modified
    And the 10 announcements keep category null and sub_category null

  @slice-1
  Scenario: The migration is reversible
    Given the migration has been applied
    When it is rolled back with "alembic downgrade -1"
    Then posts.category and posts.sub_category hold exactly the same keys as before
    And the catalog tables, the view and the functions no longer exist

  # A CHECK cannot query another row, so depth is enforced by a trigger. Without it, a third
  # level could be inserted and every consumer would have to handle a depth nobody designed for.
  @slice-1
  Scenario Outline: The catalog stays two levels deep
    When a category "<key>" with parent "<parent>" and level <level> is inserted
    Then the insert <outcome>

    Examples: accepted
      | key       | parent       | level | outcome                        |
      | lacteos   |              | 1     | succeeds as a root category    |
      | quesos    | alimentacion | 2     | succeeds as a sub-category     |

    Examples: rejected — the shape of the tree is an invariant, not a convention
      | key       | parent       | level | outcome                                      |
      | tornillos | jugos        | 2     | fails: a sub-category cannot hang off another |
      | huerfana  |              | 2     | fails: level 2 requires a parent              |
      | intrusa   | alimentacion | 1     | fails: level 1 must have no parent            |

  # This is what choosing a readable text key as the primary key bought.
  @slice-1
  Scenario: Renaming a key is a single command
    Given the product "Jugo Verde" stored with sub_category "jugos"
    When the key "jugos" is renamed to "zumos"
    Then that product now reads sub_category "zumos"
    And its labels are still "Jugos" in es and "Juices" in en
    And nothing else had to be updated by hand

  # The FK is composite on purpose: existing is not enough, it must hang off that very category.
  @slice-1
  Scenario Outline: A publication cannot claim an impossible combination
    When a post is stored with category "<category>" and sub_category "<sub_category>"
    Then the write <outcome>

    Examples:
      | category     | sub_category | outcome                                             |
      | alimentacion | jugos        | succeeds                                            |
      | alimentacion |              | succeeds: a category without sub-category is valid  |
      |              |              | succeeds: both are optional                         |
      | alimentacion | tornillos    | fails: the sub-category does not exist              |
      | jugos        | platillos    | fails: platillos does not hang off jugos            |
      |              | jugos        | fails: a sub-category with no category is orphan    |

  # Covered at unit level (Vitest): pure domain, no database involved.
  @slice-1 @component
  Scenario Outline: A key is resolved strictly when publishing, leniently when searching
    Given the value "<sent>" arrives
    When it is resolved in "<mode>" mode
    Then the result is <result>

    Examples: strict — what /publicar accepts; a label must never reach the database
      | sent         | mode   | result         | reason                        |
      | jugos        | strict | "jugos"        | exact active key              |
      | Jugos        | strict | null           | label sent instead of the key |
      | JUGOS        | strict | null           | keys are lower-case           |
      | panaderias   | strict | null           | not in the catalog            |
      |              | strict | null           | empty string                  |

    Examples: lenient — what search accepts, where the user types whatever they want
      | sent         | mode    | result         | reason                     |
      | Panadería    | lenient | "panaderia"    | label, accents normalised  |
      | PAN          | lenient | "panaderia"    | alias, case normalised      |
      | bread        | lenient | "panaderia"    | english alias               |
      | zumo         | lenient | "jugos"        | regional synonym            |
      | ferreteria   | lenient | null           | matches nothing at all      |

  @slice-1 @component
  Scenario Outline: The label follows the requested locale, with Spanish as the fallback
    Given the key "<key>"
    When its label is requested in locale "<locale>"
    Then it reads "<label>"

    Examples:
      | key       | locale | label     |
      | jugos     | es     | Jugos     |
      | jugos     | en     | Juices    |
      | panaderia | en     | Bakery    |
      | untables  | en     | Spreads   |
      | jugos     | fr     | Jugos     |
      | tornillos | es     | null      |

  @slice-1 @component
  Scenario: The selector options follow the catalog order, not the alphabet
    Given the six sub-categories of "alimentacion"
    When the options are built for locale "es"
    Then they read "Jugos", "Platillos", "Bebidas", "Panadería", "Abarrotes", "Untables" in that order
    And an inactive category is not among them

  # Without this the site cannot be deployed before the migration, and a database hiccup would
  # take the home page down over a 14-row lookup.
  @slice-1 @component
  Scenario Outline: A taxonomy that cannot be read never takes the site down
    Given the catalog query <db_state>
    When the taxonomy is requested
    Then the 7 known keys are returned anyway
    And a warning is logged

    Examples:
      | db_state                              |
      | fails because the tables do not exist |
      | fails because the database is down    |
      | returns zero rows                     |

  @slice-1 @component
  Scenario: The taxonomy is read once per request, not once per card
    Given a page that renders 12 product cards
    When it is server-rendered
    Then the catalog is queried once, not twelve times

  # ---------------------------------------------------------------------------
  # Slice 2 — the label is resolved on the server
  # The label is resolved by the server and travels as data, because CardForList also renders
  # inside a client tree (PostsWithLoadMore), where the database is unreachable.
  # Covered by Vitest:
  #   src/infra/UI/mappers/posts/mapPostsToCards.test.ts
  #   src/presentation/post/CategoryTag/CategoryTag.test.tsx
  # ---------------------------------------------------------------------------

  # This was a bug: mapPostsToCards never received a locale, so cards rendered in Spanish even
  # under /en, contradicting the detail page, which did honour it.
  @slice-2 @component
  Scenario Outline: A card shows the label in the visitor's language
    Given the product "Pan de Masa Madre Natural" published with sub-category "panaderia"
    When a visitor lists it in locale "<locale>"
    Then its card shows "<label>"

    Examples:
      | locale | label     |
      | es     | Panadería |
      | en     | Bakery    |

  @slice-2 @component
  Scenario Outline: The most specific label wins, and an unknown key shows none
    Given a publication with category "<category>" and sub-category "<sub_category>"
    When its card is mapped for locale "en"
    Then the card label is <label>

    Examples:
      | category     | sub_category | label   | reason                              |
      | alimentacion | jugos        | "Juices"| the sub-category is more specific   |
      | alimentacion |              | "Food"  | falls back to the category          |
      |              |              | null    | no category at all                  |
      | alimentacion | postres      | null    | key no longer in the catalog        |

  @slice-2
  Scenario: The infinite scroll keeps the language on page 2
    Given a visitor on the home page in locale "en"
    When more publications are loaded
    Then the new cards also read "Bakery", not "Panadería"

  # The composite FK rejects a sub-category that does not hang off the chosen category, so the
  # form must not be able to offer that combination in the first place.
  @slice-2
  Scenario: Choosing a category narrows the sub-categories to its children
    Given a signed-in admin on "/publicar"
    When this admin selects kind "producto" and category "Alimentación"
    Then the sub-category selector offers only the six children of "alimentacion"

  @slice-2
  Scenario: No category means no sub-category to choose from
    Given a signed-in admin on "/publicar" who selected kind "producto"
    When no category is chosen
    Then the sub-category selector is not offered
    And publishing stores category null and sub_category null

  # The vector lives per translation, so the category has to be read in that translation's
  # language: the `en` row must vectorise "Bakery", not "Panadería".
  @slice-2 @component
  Scenario Outline: The embedding text speaks the language of its own translation
    Given the product "Pan de Masa Madre Natural" in "alimentacion" / "panaderia"
    When the embedding text is built for its "<locale>" translation
    Then it contains "<line>"

    Examples:
      | locale | line                     |
      | es     | Sub-categoría: Panadería |
      | en     | Sub-categoría: Bakery    |

  # ---------------------------------------------------------------------------
  # Slice 3 — search and hierarchy in the database (implemented, in the other two repos)
  # NestJS (HazloSano/dev): apps/api/src/modules/products/infra/products.repository.spec.ts
  #                         apps/api/src/modules/products/infra/product.presenter.spec.ts
  #                         packages/domain/src/catalog/entities/CategoryTaxonomy.test.ts
  # Python (bot-whatsapp):  app/infrastructure/db/repositories/post_product.py
  # ---------------------------------------------------------------------------

  # The ILIKE fallback compared the user's text against the KEY, so the accent alone was
  # enough to return nothing.
  @slice-3 @component
  Scenario Outline: Searching by a category name finds its products
    Given the 3 products stored under "panaderia"
    When a visitor searches "<query>"
    Then the 3 products are returned

    Examples:
      | query     | reason               |
      | panadería | label with an accent |
      | panaderia | the key itself       |
      | Panadería | label capitalised    |
      | bakery    | label in english     |
      | pan       | alias                |

  @slice-3 @component
  Scenario: A query that matches no category and no text returns nothing
    When a visitor searches "tornillos y clavos"
    Then no products are returned, and no error is raised

  @slice-3 @component
  Scenario Outline: Filtering by a category includes its whole subtree
    When products are requested for category "<category>"
    Then <count> products are returned

    Examples:
      | category     | count | reason                                    |
      | alimentacion | 14    | the root brings its six children          |
      | jugos        | 1     | a leaf brings only itself                 |
      | ferreteria   | 0     | unknown key, empty answer and no error    |

  # El prompt agrupa por categoría; con la clave cruda el modelo leía `CATEGORY: ALIMENTACION`.
  @slice-3
  Scenario: The chatbot prompt reads a label, not a key
    Given the catalog is grouped by category to build the prompt
    When the prompt is composed
    Then it reads "CATEGORÍA: Alimentación" instead of "CATEGORY: ALIMENTACION"

  @slice-3 @component
  Scenario: An unknown key still reaches the card normalised
    Given a product stored with sub_category "tornillos"
    When its card is rendered by the mini-app
    Then it shows "tornillos" rather than going blank

  @slice-3 @component
  Scenario Outline: The API labels the catalog in the requested language
    Given the products stored under "panaderia"
    When the catalog is read in locale "<locale>"
    Then their sub-category reads "<label>"

    Examples:
      | locale | label     |
      | es     | Panadería |
      | en     | Bakery    |
      | fr     | Panadería |

  # ---------------------------------------------------------------------------
  # Slice 4 — the mini-app speaks the user's language (implemented, in HazloSano/dev)
  # Domain:    packages/domain/src/catalog/entities/categoryTree.test.ts
  # API:       apps/api/src/common/resolveLocale.spec.ts
  #            apps/api/src/modules/catalog/catalog.controller.spec.ts
  #            apps/api/src/modules/products/products.controller.spec.ts
  #            apps/api/src/modules/products/infra/products.repository.spec.ts (against the DB)
  # Use-cases: packages/use-cases/src/products/*.usecase.test.ts
  # Mini-app:  apps/telegram/src/hooks/useTelegram.spec.ts, useProducts.spec.ts
  #            apps/telegram/src/components/CategoryChips.spec.tsx
  #            apps/telegram/src/services/api.spec.ts
  # ---------------------------------------------------------------------------

  # Telegram hands over the user's language_code and it was captured without ever being used.
  @slice-4 @component
  Scenario Outline: Telegram's language decides the labels
    Given a Telegram user whose language_code is "<language_code>"
    When they open the mini-app
    Then the products read category "<category>" and sub-category "<sub_category>"

    Examples:
      | language_code | category     | sub_category | reason                          |
      | en            | Food         | Bakery       | a language the catalog has      |
      | en-US         | Food         | Bakery       | the region does not change it   |
      | es            | Alimentación | Panadería    | the site's own language         |
      | fr            | Alimentación | Panadería    | one the catalog does not have   |
      |               | Alimentación | Panadería    | the user declares no language   |

  # Lo explícito manda: el miniapp sí sabe el idioma del usuario.
  @slice-4 @component
  Scenario Outline: The requested language wins over the browser's
    Given a request asking for locale "<asked>" with Accept-Language "<header>"
    When the catalog is read
    Then the labels come back in "<used>"

    Examples:
      | asked | header             | used | reason                              |
      | en    | es-MX,es;q=0.9     | en   | explicit wins                       |
      |       | en-US,en;q=0.9     | en   | no explicit, the browser decides    |
      |       | en;q=0.8,es;q=0.9  | es   | the q factor, not the order         |
      | fr    | en-US,en;q=0.9     | en   | unsupported explicit, header decides|
      |       | fr-FR              | es   | nothing supported, the site's own   |

  @slice-4 @component
  Scenario: A title with no English translation still shows up
    Given "Jugo Verde" has a translation in "es" but not in "en"
    When an English-speaking user opens the mini-app
    Then the title stays in Spanish but the sub-category reads "Juices"

  @slice-4 @component
  Scenario: The taxonomy can be discovered over HTTP
    When "/v1/catalog/categories?locale=en" is requested
    Then it returns the two-level tree ordered by sort_order
    And inactive categories are absent
    And an inactive root takes its whole branch with it

  # Los chips salen de la tabla, no de claves escritas a mano: era la última copia que quedaba.
  @slice-4 @component
  Scenario: Tapping a chip filters by that branch
    Given the catalog offers a chip per sub-category, labelled in the user's language
    When a visitor taps "Panadería"
    Then only the products of that branch are listed
    And the chip is marked as the filter in force

  @slice-4 @component
  Scenario Outline: The filter combines with what was typed, and can be undone
    Given a visitor who typed "<query>" and tapped the chip "<chip>"
    When the results are requested
    Then the search carries both the text and the branch

    Examples:
      | query      | chip      |
      | masa madre | panaderia |

  @slice-4 @component
  Scenario: Tapping the chip in force clears the filter
    Given a visitor filtering by "jugos"
    When they tap "Jugos" again
    Then the whole catalog is listed

  @slice-4 @component
  Scenario: A catalog that cannot be read leaves the shop working
    Given the category endpoint answers an error
    When the mini-app renders
    Then no chips are shown
    And the product list still works

  # ---------------------------------------------------------------------------
  # Slice 5 — administering the taxonomy without a migration (implemented)
  # Domain:     src/domain/entities/post/newCategory.test.ts
  # Actions:    src/app/[locale]/admin/catalogo/actions.test.ts
  # Playwright: src/e2e/adminCatalog/adminCatalog.spec.ts (with an admin session)
  #
  # Categories created by the suite carry the `e2e_` prefix so they can be swept even when a
  # run dies before its afterEach — which already happened once and broke the backend golden.
  #
  # Scope: adding and (de)activating. Renaming and deleting are deliberately out —
  # renaming cascades into posts and invalidates the embedding text.
  # ---------------------------------------------------------------------------

  @slice-5
  Scenario: A new sub-category becomes available without deploying
    Given an admin on "/admin/catalogo"
    When they add the sub-category "conservas" under "alimentacion" labelled "Conservas" / "Preserves"
    Then "/publicar" offers it without a deployment
    And it reads "Preserves" for an English visitor

  # El caché dura una hora; sin invalidarlo, quien acaba de crearla no la encontraría.
  @slice-5 @component
  Scenario: What was just created is visible immediately
    Given an admin who added a category
    When the catalog is read again
    Then the new category is there, without waiting for the cache to expire

  @slice-5 @component
  Scenario Outline: A key that the database would reject is named before saving
    Given an admin filling the form with the key "<key>"
    When they submit
    Then the form explains "<problem>" and nothing is written

    Examples:
      | key                | problem                          |
      | MAL                | mayúsculas                       |
      | con espacios       | espacios                          |
      | conservás          | acento                            |
      | jugos              | la clave ya existe                |
      |                    | la clave es obligatoria           |

  @slice-5 @component
  Scenario: Two admins racing for the same key get a message, not an error page
    Given the key "conservas" was taken between the check and the save
    When the form is submitted
    Then it says the key was taken and the page keeps working

  # Una Server Action es un endpoint: se puede invocar sin pasar por la página.
  @slice-5 @component
  Scenario Outline: Only an admin can edit the catalog
    Given a caller who is <role>
    When they invoke the catalog action directly
    Then the catalog is <outcome>

    Examples:
      | role         | outcome        |
      | an admin     | modified       |
      | not an admin | left untouched |

  # 404 y no 403: una página interna no tiene por qué revelar que existe.
  @slice-5
  Scenario: The admin page does not reveal itself to anyone else
    Given a visitor who is not an admin
    When they open "/admin/catalogo"
    Then the answer is 404

  @slice-5
  Scenario: A deactivated category can be switched back on
    Given a sub-category an admin just deactivated
    When they press the toggle again on the same page
    Then it reads active once more

  @slice-5
  Scenario: Deactivating a category hides it from the form but not from its products
    Given the sub-category "abarrotes" with published products
    When an admin deactivates it
    Then it disappears from the "/publicar" selector
    And it disappears from the category filters
    And its products keep showing their label
    And it can be activated again from the same page
