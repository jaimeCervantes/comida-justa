Feature: Publish Hazlo Sano product
  Distinguish products sold by Hazlo Sano (own or resale) from community listings,
  using two orthogonal fields on a Post: kind (anuncio | producto) and origin.

  As Hazlo Sano (admin)
  I want to mark a publication as a product with an origin
  So that its provenance is visible and my products can be administered apart

  Background:
    Given the app is running with PostgreSQL as the database

  # ---------------------------------------------------------------------------
  # Slice 1 — mark & show a Hazlo Sano product (implemented)
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario: Admin publishes a Hazlo Sano product and the badge is shown
    Given a signed-in admin on "/publicar"
    When this admin fills the form with:
      | title       | Crema de cacahuate artesanal                    |
      | description | Cacahuate orgánico molido, sin azúcar añadida.  |
      | price       | 120                                             |
      | phone       | 2781092116                                      |
      | media       | ./src/e2e/dummies/post.jpg                       |
    And selects kind "producto"
    And selects origin "hazlo_sano_propio"
    And submits the form
    Then the post is saved with kind "producto" and origin "hazlo_sano_propio"
    And the post detail page shows a "🌿 Hazlo Sano" badge

  # Reescrito por el slice 1 de `docs/features/productores-locales.md`: el selector dejó de ser
  # admin-only —lo ve cualquiera que publique un producto— y lo admin-only pasó a ser *qué
  # procedencias ofrece*. Los escenarios vivos de esa regla están en
  # `src/e2e/localProducers/localProducers.feature`.
  @slice-1
  Scenario: A non-admin user does not get the Hazlo Sano origins
    Given a signed-in non-admin user on "/publicar"
    Then the origin selector offers only the community origins
    When this user submits a product with origin "hazlo_sano_propio" via a forged request
    Then the server discards the "hazlo_sano_*" origin
    And the product is rejected for having no provenance left
    And no post is created

  @slice-1
  Scenario: A product requires a price
    Given a signed-in admin on "/publicar"
    When this admin selects kind "producto" and leaves the price empty
    And submits the form
    Then a validation error about the required price is shown
    And no post is created

  @slice-1
  Scenario: Existing publications remain plain anuncios
    Given a publication created before this feature
    When it is displayed
    Then it behaves as an "anuncio" with origin unset
    And no provenance badge is shown

  # ---------------------------------------------------------------------------
  # Slice 2 — product listing (implemented)
  # For now the products page shows ONLY Hazlo Sano products; the general
  # all-products listing and origin filter are deferred.
  # Scenarios live in src/e2e/products/products.spec.ts
  # ---------------------------------------------------------------------------

  @slice-2
  Scenario: The products page lists only Hazlo Sano products
    Given a Hazlo Sano product "Miel de abeja de Hazlo Sano" with origin "hazlo_sano_propio"
    And a community product "Miel de abeja del vecino" with origin "productor"
    And an "anuncio" from Hazlo Sano "Aviso de Hazlo Sano" with origin "hazlo_sano_propio"
    When a visitor opens "/productos"
    Then the Hazlo Sano product is listed
    And the community product is not listed
    And the "anuncio" is not listed

  @slice-2
  Scenario: Each listed product card shows its provenance badge
    Given a Hazlo Sano product with origin "hazlo_sano_propio"
    When a visitor opens "/productos"
    Then that product card shows a "🌿 Hazlo Sano" badge

  # Covered at component level (Vitest) — an empty DB state is not reproducible
  # against the shared database the e2e suite runs on.
  @slice-2 @component
  Scenario: The products page has no products yet
    Given no Hazlo Sano products exist
    When a visitor opens "/productos"
    Then an empty-state message is shown instead of the grid

  # ---------------------------------------------------------------------------
  # Slice 3 — reports by origin (implemented)
  # Scenarios live in src/e2e/productsReport/productsReport.spec.ts
  # ---------------------------------------------------------------------------

  @slice-3
  Scenario: Admin sees product counts grouped by origin
    Given a signed-in admin
    When this admin opens "/admin/productos"
    Then a row is shown for every known origin, plus one for products without origin
    And publishing one more product with origin "hazlo_sano_propio" raises that row's count by one
    And the navigation shows a "Reporte" entry

  @slice-3
  Scenario: The report is admin-only
    Given a signed-in non-admin user
    When this user opens "/admin/productos"
    Then the response status is 404
    And neither the report nor its "Reporte" navigation entry is shown

  # Covered at unit level (Vitest): the report always lists every origin in the
  # allowlist, even the ones with no products yet.
  @slice-3 @component
  Scenario: Origins with no products are still listed
    Given products exist for only one origin
    When the report is built
    Then every other origin is listed with a count of zero
