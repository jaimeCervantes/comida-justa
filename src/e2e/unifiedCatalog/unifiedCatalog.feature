Feature: Unified catalog
  Merge the chatbot's `products` table into `posts`, so that what a user publishes on the
  website is — with no synchronisation in between — what the chatbot can recommend.
  A publication is a publication; `kind` decides what it is. The website shows everything,
  the chatbot queries `kind = 'producto' AND is_available`.

  Context:
  - Problem: two catalogs of the same seller live in the same database and ignore each other —
    `products` (9 rows, read by the chatbot) and `posts` with kind='producto' (4 rows, shown by
    the website). What a user publishes on the site is invisible to the bot, and the menu the
    bot sells is invisible on the site.
  - Savings: removes the permanent cost of syncing two tables that hold the same set — two ids
    per product, a price edited on one side only, every new field decided twice. The website
    inherits semantic search and the bot inherits i18n and long-form content, building neither.
  - Why: every registered user is meant to become a seller, and the catalog is meant to be what
    the community publishes — daily menu, local suppliers and people's listings. Once both sets
    converge, keeping them in separate tables is pure debt.

  As Hazlo Sano
  I want a single catalog behind the website and the chatbot
  So that publishing once is enough to be found in both places

  Background:
    Given the app is running with PostgreSQL as the database
    And the category allowlist is:
      | key          | label es     | label en |
      | alimentacion | Alimentación | Food     |
    And the sub-category allowlist is:
      | key       | label es  | label en  |
      | jugos     | Jugos     | Juices    |
      | comidas   | Comidas   | Meals     |
      | bebidas   | Bebidas   | Drinks    |
      | panaderia | Panadería | Bakery    |
      | abarrotes | Abarrotes | Groceries |

  # ---------------------------------------------------------------------------
  # Slice 1 — unified schema & category on publishing (implemented)
  # Scenarios live in src/e2e/unifiedCatalog/unifiedCatalog.spec.ts
  # Allowlist and label rules are covered by Vitest:
  #   src/domain/entities/post/category.test.ts
  #   src/infra/UI/labels/postCategoryLabels.test.ts
  #   src/infra/UI/components/CategoryTag/CategoryTag.test.tsx
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario Outline: A product is published with a category and a sub-category
    Given a signed-in admin on "/publicar"
    When this admin fills the form with:
      | title       | <title>       |
      | description | <description> |
      | price       | <price>       |
      | phone       | 2781126948    |
      | media       | ./src/e2e/dummies/post.jpg |
    And selects kind "producto"
    And selects category "<category>" and sub-category "<sub_category>"
    And submits the form
    Then the post is stored with category "<category>" and sub_category "<sub_category>"
    And the post is stored with is_available true
    And its detail page shows the label "<label_es>"

    Examples:
      | title                      | description                                | price | category     | sub_category | label_es  |
      | Jugo Verde                 | Espinaca, apio, pepino y limón. Sin azúcar | 40    | alimentacion | jugos        | Jugos     |
      | Pechuga de pollo asada     | Pechuga en bistec con ensalada             | 105   | alimentacion | comidas      | Comidas   |
      | Agua de Avena con canela   | Agua fresca de avena, endulzada con dátil  | 20    | alimentacion | bebidas      | Bebidas   |
      | Crema de Cacahuate Natural | Solo cacahuate, sin azúcar ni aceites      | 110   | alimentacion | abarrotes    | Abarrotes |

  @slice-1
  Scenario Outline: The label follows the visitor's locale, never the database
    Given a product "Jugo Verde" published with sub-category "<key>"
    When a visitor opens its detail page in locale "<locale>"
    Then the sub-category is shown as "<label>"

    Examples:
      | key       | locale | label     |
      | jugos     | es     | Jugos     |
      | jugos     | en     | Juices    |
      | panaderia | es     | Panadería |
      | panaderia | en     | Bakery    |

  @slice-1
  Scenario: The category is optional in this slice
    Given a signed-in admin on "/publicar"
    When this admin publishes the product "Pan de Masa Madre Natural" at 96 without choosing a category
    Then the post is stored with category null and sub_category null
    And its card is listed on "/productos" with no category label
    And no validation error is shown

  @slice-1
  Scenario: Publications created before the unified schema keep working
    Given the existing publication "Crema de cacahuate artesanal" created before this feature
    When it is displayed
    Then its stored fields are:
      | field        | value    |
      | kind         | producto |
      | is_available | true     |
      | category     | null     |
      | sub_category | null     |
      | seller_id    | null     |
      | external_url | null     |
    And nothing about its rendering changes

  # Covered at unit level (Vitest): the allowlist is the only source of category keys.
  @slice-1 @component
  Scenario Outline: Only allowlist keys are accepted
    Given a publish request carrying category "<sent>"
    When the post is validated
    Then the stored category is <stored>

    Examples: rejected — labels, unknown keys and empty values never reach the database
      | sent         | stored       | reason                          |
      | Alimentación | null         | label sent instead of the key   |
      | electronica  | null         | not in the allowlist            |
      | ALIMENTACION | null         | allowlist keys are lower-case   |
      |              | null         | empty string                    |

    Examples: accepted
      | sent         | stored         | reason              |
      | alimentacion | "alimentacion" | exact allowlist key |

  # ---------------------------------------------------------------------------
  # Slice 2 — migrate the 9 products into posts
  # ---------------------------------------------------------------------------

  @slice-2 @future
  Scenario Outline: Each legacy product becomes a publication, field by field
    Given the legacy product "<name>" priced <price> with seller "Hazlo Sano"
    When the migration script runs
    Then a post exists with the same id and:
      | field              | value                |
      | kind               | producto             |
      | title (es)         | <name>               |
      | price              | <price>              |
      | origin             | hazlo_sano_propio    |
      | sub_category       | <sub_category>       |
      | contact_whatsapp   | 522781126948         |
    And its embedding is the one the product already had, not a regenerated vector

    Examples:
      | name                     | price | sub_category |
      | Jugo Verde               | 40    | jugos        |
      | Pechuga de pollo asada   | 105   | comidas      |
      | Agua de Avena con canela | 20    | bebidas      |

  @slice-2 @future
  Scenario: The migration can be run twice without duplicating
    Given the 9 legacy products have already been migrated
    When the migration script runs again
    Then the total of posts with kind "producto" stays at 13
    And no duplicate title is created

  @slice-2 @future
  Scenario: The recommendation history still resolves after the migration
    Given a stored recommendation pointing at the id of "Jugo Verde"
    When that id is looked up after the migration
    Then it resolves to the migrated post

  # ---------------------------------------------------------------------------
  # Slice 3 — the chatbot reads from posts through the SQL function
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario: Recommendations do not change after the migration
    Given the results recorded for "algo para desayunar" against the legacy table
    When the chatbot runs the same query against posts
    Then it recommends the same products in the same order

  @slice-3 @future
  Scenario: A product published on the website is recommended by the chatbot
    Given the product "Pan de Masa Madre con Semillas" published from "/publicar" with its embedding stored
    When a chatbot user asks "quiero pan sin químicos"
    Then that product is among the recommendations

  @slice-3 @future
  Scenario Outline: Paid sellers get their boost, unavailable products get nothing
    Given two products at the same cosine distance from the query
    And the first belongs to a seller with membership <membership> and paid ads <ads>
    When the ranking runs
    Then the first product's score gets a boost of <boost>

    Examples:
      | membership | ads   | boost |
      | true       | true  | 0.25  |
      | true       | false | 0.15  |
      | false      | true  | 0.10  |
      | false      | false | 0.00  |

  @slice-3 @future
  Scenario: A missing translation falls back to the default locale
    Given "Jugo Verde" has a translation in "es" but not in "en"
    When the chatbot searches in locale "en"
    Then the product is still found through its "es" translation

  # ---------------------------------------------------------------------------
  # Slice 4 — embedding generated when publishing
  # ---------------------------------------------------------------------------

  @slice-4 @future
  Scenario: Publishing a product stores its embedding
    Given a signed-in user publishing "Suero natural" at 35
    When the publication succeeds
    Then its "es" translation holds a 768-dimension embedding

  @slice-4 @future
  Scenario: Publishing survives the embedding provider being down
    Given the embedding provider returns an error
    When a user publishes "Eléctrolitos de frutos rojos" at 35
    Then the publication is created with embedding null
    And it is reported as pending indexing
    And the backfill stores its embedding on the next run

  # ---------------------------------------------------------------------------
  # Slice 5 — semantic search on the website
  # ---------------------------------------------------------------------------

  @slice-5 @future
  Scenario Outline: Searching by intent finds products with no literal word match
    Given the catalog holds "Omelet con ensalada", "Agua de Avena con canela" and "Jugo Verde"
    When a visitor searches "<query>"
    Then "<expected>" is among the results

    Examples:
      | query                        | expected                 |
      | algo ligero para desayunar   | Omelet con ensalada      |
      | una bebida caliente y dulce  | Agua de Avena con canela |
      | algo con verduras            | Jugo Verde               |

  @slice-5 @future
  Scenario: Pagination does not load every match into memory
    Given 120 publications match the query
    When a visitor opens page 2 with a page size of 12
    Then only 12 rows are fetched from the database

  # ---------------------------------------------------------------------------
  # Slice 6 — sellers and location
  # ---------------------------------------------------------------------------

  @slice-6 @future
  Scenario: Publishing a product links the user to a seller profile
    Given a signed-in user with no seller profile
    When this user publishes "Miel de abeja del vecino" at 150
    Then a seller profile is created and linked to that account
    And the product is stored with that seller_id

  @slice-6 @future
  Scenario Outline: Proximity decides who sees the product
    Given a product whose seller has a branch <distance_km> km away from the user
    And the recommendation radius is 10 km
    When the chatbot recommends with the user's location
    Then the product <outcome>

    Examples:
      | distance_km | outcome                                  |
      | 2           | is included in the nearby results        |
      | 25          | only appears in the fallback without geo |

  @slice-6 @future
  Scenario: A local supplier exists without a website account
    Given an admin registering the supplier "MMNaturalmente" with no user account
    When products are created for that seller
    Then they can still be recommended by the chatbot
