Feature: Brand page in the main menu

  The page that explains what Hazlo Sano is lives at `/nosotros` and is reachable from the
  main menu. It used to be `/info`, a name that said nothing to a visitor nor to a search
  engine, and it was only linked from the footer.

  Context:
  - Problem: the page that explains the ecosystem (4 pilares, chatbot, contacto) was invisible
    in the navigation — only one footer link pointed at it — and its URL, `/info`, communicated
    nothing. Its anchor text ("Productos Naturales") competed with `/productos` for the same
    search intent, when `/productos` is already the catalog of those very products
    (see `src/scripts/seedHazloSanoProducts.ts`, seeded from this page).
  - Savings: one entry point in the menu instead of a page nobody finds; and no keyword
    cannibalisation to undo later — `/nosotros` owns the brand intent, `/productos` the
    transactional one.
  - Why: whoever arrives through the catalog needs to know who is behind it, and whoever
    searches "Hazlo Sano" must land on a page that explains it.

  As a visitor
  I want to reach the brand page from the main menu
  So that I understand what Hazlo Sano is before buying anything

  # ---------------------------------------------------------------------------
  # Slice 1 — rename `/info` to `/nosotros` and put it in the menu (implemented)
  # Scenarios live in src/e2e/about/about.spec.ts
  # ---------------------------------------------------------------------------

  @slice-1
  Scenario: The main menu leads to the brand page
    Given a visitor on the home page
    When this visitor clicks "Nosotros" in the main menu
    Then the browser is on "/nosotros"
    And the page shows the heading "Qué es Hazlo Sano"

  @slice-1
  Scenario: The old URL keeps working
    Given an external link or an indexed result pointing at "/info"
    When a visitor opens it
    Then the response is a permanent redirect (308) to "/nosotros"
    And the page shows the heading "Qué es Hazlo Sano"
