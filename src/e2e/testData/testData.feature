Feature: Test data that does not outlive the suite
  A run of the end-to-end suite must not be able to leave rows behind in the database that three
  repositories share, even when the process dies halfway.

  Context:
  - Problem: cleanup lives only in `afterEach`, and `afterEach` does not run when the process dies.
    It already happened: three publications seeded by products.spec.ts survived a crashed run. The
    backend's recommendation golden started failing with "2 products still unindexed", an
    apps/api integration test failed with 16 products against 14 — and was misdiagnosed as
    concurrency the first time — and /productos showed test publications to anyone who visited.
  - Savings: stops the cost of diagnosing someone else's failures across three repositories, and
    stops polluting a shared database that is also the catalog's production data.
  - Why: the e2e suite is the net that protects everything else. Once its own residue breaks other
    repositories' tests, the net costs more than it catches — and the easy answer is to stop
    running it.

  As the team that maintains three repositories on one database
  I want test data to be recognisable and swept whatever happens
  So that a crashed run never becomes someone else's failing test

  Background:
    Given the suite seeds publications through the write repository and through /publicar
    And every seeded slug starts with "e2e-"

  # ---------------------------------------------------------------------------
  # Slice 1 — the test slug is marked and swept
  # ---------------------------------------------------------------------------

  # Es el incidente que motivó la feature, dicho como escenario.
  @slice-1
  Scenario: A crashed run does not poison the next one
    Given a previous run left the publication "e2e-miel-de-abeja-1785417725068" behind
    When the suite starts again
    Then that publication is gone before the first scenario runs

  @slice-1
  Scenario: A leftover is never silent
    Given a publication with the test prefix is still there when the suite ends
    When the teardown runs
    Then the suite fails, naming what was left and how to remove it

  # El marcador tiene que distinguir, no solo coincidir: barrer de más sería peor que no barrer.
  @slice-1 @component
  Scenario Outline: Only test data is recognised as test data
    Given the slug "<slug>"
    When the sweep decides whether it is test data
    Then the answer is <verdict>

    Examples: swept
      | slug                                | verdict | reason                      |
      | e2e-miel-de-abeja-1785417725068     | yes     | the agreed prefix           |
      | e2e-producto-de-reporte-1785417725  | yes     | any name after the prefix   |

    Examples: left alone
      | slug                                | verdict | reason                            |
      | miel-de-abeja-1785417725068         | no      | real content ending in digits     |
      | jugo-verde                          | no      | real content                      |
      | pan-de-masa-madre-natural           | no      | real content                      |
      | mie2e-de-abeja                      | no      | contains the marker, not prefixed |

  @slice-1 @component
  Scenario: The sweep removes a publication with everything hanging off it
    Given a seeded publication with its translation and its media
    When the sweep runs
    Then none of the three rows are left

  @slice-1
  Scenario: The real catalog is never touched
    Given the 14 real products and the 7 real categories
    When the sweep runs
    Then all of them are still there

  # Lo que rompió el golden del backend: la comprobación que cierra el círculo.
  @slice-1
  Scenario: The other repositories stay green after a full run
    Given the whole suite has just finished
    When the backend's tests and apps/api's integration tests run
    Then they pass, because no test data was left for them to trip on

  # ---------------------------------------------------------------------------
  # Slice 2 — the suite stops publishing as a real person
  # ---------------------------------------------------------------------------

  @slice-2 @future
  Scenario: A seeded publication belongs to nobody real
    Given the suite seeds a publication
    When its author is read
    Then it is the test user, not the first person in the users table

  @slice-2 @future
  Scenario: The sweep no longer depends on the name
    Given a publication seeded with any slug at all
    When the sweep runs by author
    Then it is removed

  # ---------------------------------------------------------------------------
  # Slice 3 — CI notices
  # ---------------------------------------------------------------------------

  @slice-3 @future
  Scenario: The pipeline refuses to go green with test data in the database
    Given the pipeline finished its tests
    When the database still holds a publication with the test prefix
    Then the pipeline fails
