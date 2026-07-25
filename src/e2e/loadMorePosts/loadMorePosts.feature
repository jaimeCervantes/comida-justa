Feature: Load more posts on the home feed
  The home feed shows the first page and loads the rest on scroll or on "Cargar más",
  fetching /api/posts/page/{page}/pageSize/{size}.

  Context:
  - Problem: the route handler lived in `route.tsx`, an extension Next.js does not resolve
    for route handlers, so every request answered 404 with the HTML not-found page. The
    client swallowed it in a try/catch and the feed simply stopped growing, with no error
    on screen. It only became obvious once the catalog migration took the feed to 23 posts.
  - Savings: a visitor can reach every publication instead of only the newest page, and a
    silent 404 in the feed cannot come back unnoticed.
  - Why: the feed is the front door of the site; what cannot be scrolled might as well not
    be published.

  As a visitor
  I want the feed to keep loading publications
  So that I can see everything that has been published, not just the first page

  Background:
    Given the app is running with PostgreSQL as the database

  @regression
  Scenario: The pagination endpoint answers with the next page
    When the client requests page 2 with a page size of 8
    Then the response status is 200
    And it carries a JSON body with its posts, not the HTML not-found page

  @regression
  Scenario: Pressing "Cargar más" appends the next page to the feed
    Given a visitor on the home page seeing the first page of posts
    When this visitor presses "Cargar más"
    Then more cards are shown than before
    And no card is repeated
