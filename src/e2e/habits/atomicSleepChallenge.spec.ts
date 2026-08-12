import { expect, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "~/e2e/testUtils/simulateLogin";
import {
  backdateAtomicSleepChallengeForSevenDayTest,
  clearHabitMilestoneMarker,
  countAtomicSleepRepetitions,
  countStartedHabitRituals,
  deleteAtomicSleepChallengeTestData,
  readSuiteAccountDisplayName,
} from "./testData";

test.describe("Del atardecer al amanecer", () => {
  let session: DbSession | null = null;

  test.beforeEach(async ({ page, browserName }) => {
    await deleteAtomicSleepChallengeTestData();
    session = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    await deleteAtomicSleepChallengeTestData();
    if (session) await deleteSession(session.sessionToken);
    session = null;
  });

  test("the sleep pillar includes a first cycle with an immediate reward", async ({
    page,
  }) => {
    await page.goto("/pilares/sueno");
    await expect(page).toHaveURL(/\/pilares\/sueno$/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Del atardecer al amanecer" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Empezar Del atardecer al amanecer" })
      .click();
    await page
      .getByRole("checkbox", {
        name: "Estacioné mis dispositivos y bajé las luces",
      })
      .check();
    await page
      .getByRole("checkbox", {
        name: "Salí a recibir luz natural exterior al despertar",
      })
      .check();
    await page
      .getByRole("button", { name: "Completar mi primer ciclo" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Tu semilla despertó" }),
    ).toBeVisible();
    await expect(page.getByText("Nivel: Brote")).toBeVisible();
    await expect(page.getByText("10 puntos").first()).toBeVisible();
    await expect(page.getByText("Primer paso")).toBeVisible();
  });

  test("sharing projects one card and one dismissible site message", async ({
    page,
  }) => {
    await completeFirstCycle(page);
    const suiteDisplayName = await readSuiteAccountDisplayName();
    const celebration = page
      .getByTestId("public-habit-celebration")
      .filter({ hasText: suiteDisplayName });

    await page.goto("/");
    await expect(celebration).toHaveCount(0);
    await page.goto("/pilares/sueno");
    await page
      .getByRole("button", { name: "Compartir con la comunidad" })
      .click();
    await page.goto("/");

    await expect(celebration).toBeVisible();
    await expect(
      page.getByText("Nuevo logro comunitario", { exact: false }),
    ).toBeVisible();
    const beforeFeed = await celebration.evaluate((card) => {
      const feed = document.querySelector('[data-testid="feed-masonry"]');
      return Boolean(
        feed &&
          card.compareDocumentPosition(feed) & Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(beforeFeed).toBe(true);

    await celebration.getByRole("button", { name: "Celebrar" }).click();
    await expect(
      celebration.getByRole("button", { name: "Retirar celebración" }),
    ).toBeVisible();
    await expect(celebration.getByText("1 celebraciones")).toBeVisible();
    await celebration
      .getByRole("button", { name: "Retirar celebración" })
      .click();
    await expect(celebration.getByText("0 celebraciones")).toBeVisible();

    await page.getByRole("button", { name: "Cerrar este mensaje" }).click();
    await expect(
      page.getByText("Nuevo logro comunitario", { exact: false }),
    ).toHaveCount(0);
    await page.goto("/productos");
    await expect(
      page.getByText("Nuevo logro comunitario", { exact: false }),
    ).toHaveCount(0);
    await page.goto("/");
    await expect(celebration).toBeVisible();

    await page.goto("/pilares/sueno");
    await page.getByRole("button", { name: "Dejar de compartir" }).click();
    await page.goto("/");
    await expect(celebration).toHaveCount(0);
    await page.goto("/pilares/sueno");
    await expect(page.getByText("Nivel: Brote")).toBeVisible();
    await expect(page.getByText("10 puntos").first()).toBeVisible();
  });

  test("sharing several pillars keeps one recent card per celebration", async ({
    page,
  }) => {
    const suiteDisplayName = await readSuiteAccountDisplayName();
    await completeFirstCycle(page);
    await page
      .getByRole("button", { name: "Compartir con la comunidad" })
      .click();

    await page.goto("/pilares/alimentacion");
    await page.getByRole("button", { name: "Empezar Una planta más" }).click();
    await page.getByRole("checkbox", { name: "Elegí mi comida ancla" }).check();
    await page.getByRole("checkbox", { name: "Sumé una planta" }).check();
    await page
      .getByRole("button", { name: "Cultivar mi primera elección" })
      .click();
    await page
      .getByRole("button", { name: "Compartir con la comunidad" })
      .click();
    await page.goto("/");

    const suiteCelebrations = page
      .getByTestId("public-habit-celebration")
      .filter({ hasText: suiteDisplayName });
    await expect(suiteCelebrations).toHaveCount(2);
    await expect(
      suiteCelebrations.filter({
        has: page.getByRole("link", { name: /Conocer Una planta más/ }),
      }),
    ).toBeVisible();
    await expect(
      suiteCelebrations.filter({
        has: page.getByRole("link", { name: /Conocer el ritual/ }),
      }),
    ).toBeVisible();
    expect(
      await suiteCelebrations.evaluateAll((cards) =>
        cards.map((card) => card.getAttribute("data-pillar")),
      ),
    ).toEqual(["nutrition", "sleep"]);
  });

  test("legacy nutrition progress can publish from its persisted repetition", async ({
    page,
  }) => {
    const suiteDisplayName = await readSuiteAccountDisplayName();
    await page.goto("/pilares/alimentacion");
    await page.getByRole("button", { name: "Empezar Una planta más" }).click();
    await page.getByRole("checkbox", { name: "Elegí mi comida ancla" }).check();
    await page.getByRole("checkbox", { name: "Sumé una planta" }).check();
    await page
      .getByRole("button", { name: "Cultivar mi primera elección" })
      .click();
    await clearHabitMilestoneMarker("nutrition-one-plant-v1", "first_cycle");

    await page
      .getByRole("button", { name: "Compartir con la comunidad" })
      .click();
    await page.goto("/");

    await expect(
      page
        .locator(
          '[data-testid="public-habit-celebration"][data-pillar="nutrition"]',
        )
        .filter({ hasText: suiteDisplayName }),
    ).toBeVisible();
  });

  test("five distinct local mornings complete the seven-day challenge", async ({
    page,
  }) => {
    await page.goto("/pilares/sueno");
    await page
      .getByRole("button", { name: "Empezar Del atardecer al amanecer" })
      .click();
    await expect(page.getByText("0 de 7 ciclos")).toBeVisible();
    const cycleDates = await backdateAtomicSleepChallengeForSevenDayTest();
    await page.reload();

    for (const [index, cycleDate] of cycleDates.entries()) {
      await page.getByRole("checkbox").nth(0).check();
      await page.getByRole("checkbox").nth(1).check();
      await page.locator('select[name="cycleDate"]').selectOption(cycleDate);
      await page
        .getByRole("button", {
          name:
            cycleDate === cycleDates[0]
              ? "Completar mi primer ciclo"
              : "Registrar este ciclo",
        })
        .click();
      await expect(page.getByText(`${index + 1} de 7 ciclos`)).toBeVisible();
    }

    await expect(
      page.getByRole("heading", {
        name: "Protegiste tu descanso cinco veces",
      }),
    ).toBeVisible();
    await expect(page.getByText("5 de 7 ciclos")).toBeVisible();
    await expect(page.getByText("50 puntos").first()).toBeVisible();
    await expect(page.getByText("Cosecha de descanso")).toBeVisible();
    await expect(
      page.getByText(/Siete días no bastan para afirmar/),
    ).toBeVisible();
    expect(await countAtomicSleepRepetitions()).toBe(5);

    await page
      .getByRole("button", { name: "Compartir con la comunidad" })
      .click();
    await page.getByRole("button", { name: "Dejar de compartir" }).click();
    await expect(page.getByText("50 puntos").first()).toBeVisible();
    await expect(page.getByText("Cosecha de descanso")).toBeVisible();
  });

  test("shared repetitions grow the aggregate garden and can be withdrawn", async ({
    page,
  }) => {
    await completeFirstCycle(page);
    await page.goto("/");
    const sleepPlot = page.locator('[data-pillar="sleep"]');
    const before = Number(await sleepPlot.locator("strong").textContent());

    await page.goto("/pilares/sueno");
    await page
      .getByRole("button", { name: "Aportar mis repeticiones al jardín" })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Retirar mis repeticiones del jardín",
      }),
    ).toBeVisible();
    await page.goto("/");
    await expect(sleepPlot.locator("strong")).toHaveText(String(before + 1));

    await page.goto("/pilares/sueno");
    await page
      .getByRole("button", { name: "Retirar mis repeticiones del jardín" })
      .click();
    await page.goto("/");
    await expect(sleepPlot.locator("strong")).toHaveText(String(before));
    await expect(page.getByTestId("community-habit-garden")).toContainText(
      "Los grupos todavía no están disponibles",
    );
  });

  test("two pillars keep independent progress at the same time", async ({
    page,
  }) => {
    await page.goto("/pilares/sueno");
    await page
      .getByRole("button", { name: "Empezar Del atardecer al amanecer" })
      .click();
    await page.getByRole("checkbox").nth(0).check();
    await page.getByRole("checkbox").nth(1).check();
    await page
      .getByRole("button", { name: "Completar mi primer ciclo" })
      .click();
    await expect(page.getByText("1 de 7 ciclos")).toBeVisible();

    await page.goto("/pilares/alimentacion");
    await expect(page).toHaveURL(/\/pilares\/alimentacion$/);
    await page.getByRole("button", { name: "Empezar Una planta más" }).click();
    await expect(page.getByText("0 de 7 elecciones")).toBeVisible();
    await page.getByRole("checkbox", { name: "Elegí mi comida ancla" }).check();
    await page.getByRole("checkbox", { name: "Sumé una planta" }).check();
    await page
      .getByRole("button", { name: "Cultivar mi primera elección" })
      .click();
    await expect(page.getByText("1 de 7 elecciones")).toBeVisible();

    expect(await countStartedHabitRituals()).toBe(2);
    await page.goto("/pilares/sueno");
    await expect(page.getByText("1 de 7 ciclos")).toBeVisible();
    await expect(page.getByText("10 puntos").first()).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Continuar con mi semana de descanso",
      }),
    ).toHaveCount(0);

    await page.goto("/en/pillars/alimentacion");
    await expect(
      page.getByRole("heading", { name: "One more plant" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Telegram reminders unavailable" }),
    ).toBeDisabled();
  });

  test("nutrition becomes a complete orange ritual with a five-of-seven harvest", async ({
    page,
  }) => {
    await page.goto("/pilares/alimentacion");
    await expect(
      page.getByRole("heading", { name: "Una planta más" }),
    ).toBeVisible();
    await expect(
      page.getByText("Soy una persona que hace fácil elegir comida real"),
    ).toBeVisible();
    await expect(page.getByText("Elegir mi comida ancla")).toBeVisible();
    await expect(
      page.getByText("Sumar una planta", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/visible, lavado o porcionado/i)).toBeVisible();

    await page.getByRole("button", { name: "Empezar Una planta más" }).click();
    await expect(page.getByText("0 de 7 elecciones")).toBeVisible();
    const cycleDates = await backdateAtomicSleepChallengeForSevenDayTest();
    await page.reload();
    for (const [index, cycleDate] of cycleDates.entries()) {
      await page
        .getByRole("checkbox", { name: "Elegí mi comida ancla" })
        .check();
      await page.getByRole("checkbox", { name: "Sumé una planta" }).check();
      await page.locator('select[name="cycleDate"]').selectOption(cycleDate);
      await page
        .getByRole("button", {
          name:
            cycleDate === cycleDates[0]
              ? "Cultivar mi primera elección"
              : "Registrar esta elección",
        })
        .click();
      await expect(
        page.getByText(`${index + 1} de 7 elecciones`),
      ).toBeVisible();
    }

    await expect(
      page.getByRole("heading", {
        name: "Cultivaste cinco elecciones reales",
      }),
    ).toBeVisible();
    await expect(page.getByText("5 de 7 elecciones")).toBeVisible();
    await expect(page.getByText("50 puntos").first()).toBeVisible();
  });

  test("a shared nutrition milestone keeps nutrition text, design and destination", async ({
    page,
  }) => {
    await page.goto("/pilares/alimentacion");
    await page.getByRole("button", { name: "Empezar Una planta más" }).click();
    await page.getByRole("checkbox", { name: "Elegí mi comida ancla" }).check();
    await page.getByRole("checkbox", { name: "Sumé una planta" }).check();
    await page
      .getByRole("button", { name: "Cultivar mi primera elección" })
      .click();
    await page
      .getByRole("button", { name: "Compartir con la comunidad" })
      .click();
    await page.goto("/");

    const card = page.getByTestId("public-habit-celebration");
    await expect(card).toHaveAttribute("data-pillar", "nutrition");
    await expect(card).toContainText("cultivó su primera elección real");
    await expect(
      card.getByRole("link", { name: /Conocer Una planta más/ }),
    ).toHaveAttribute("href", "/pilares/alimentacion");
    await expect(page.getByText(/primera elección real/).first()).toBeVisible();
  });

  test("movement turns two minutes into a green ritual without volume scoring", async ({
    page,
  }) => {
    await page.goto("/pilares/movimiento");
    await expect(
      page.getByRole("heading", { name: "Dos minutos cuentan" }),
    ).toBeVisible();
    await expect(
      page.getByText("Soy una persona que empieza a moverse"),
    ).toBeVisible();
    await expect(
      page.getByText(/ropa preparada, una pausa o una ruta cotidiana/i),
    ).toBeVisible();
    await expect(
      page.getByText(/continuar es opcional y no suma puntos/i),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Empezar Dos minutos cuentan" })
      .click();
    await expect(page.getByText("0 de 7 inicios")).toBeVisible();
    const cycleDates = await backdateAtomicSleepChallengeForSevenDayTest();
    await page.reload();
    for (const [index, cycleDate] of cycleDates.entries()) {
      await page
        .getByRole("checkbox", { name: "Usé mi señal para empezar" })
        .check();
      await page
        .getByRole("checkbox", {
          name: "Me moví dos minutos según mi capacidad",
        })
        .check();
      await page.locator('select[name="cycleDate"]').selectOption(cycleDate);
      await page
        .getByRole("button", {
          name:
            index === 0
              ? "Registrar mi primer inicio"
              : "Registrar este inicio",
        })
        .click();
      await expect(page.getByText(`${index + 1} de 7 inicios`)).toBeVisible();
    }
    await expect(
      page.getByRole("heading", { name: "Empezaste a moverte cinco veces" }),
    ).toBeVisible();
    await expect(page.getByText("50 puntos").first()).toBeVisible();
  });

  test("a shared movement milestone links back to Movement", async ({
    page,
  }) => {
    await page.goto("/pilares/movimiento");
    await page
      .getByRole("button", { name: "Empezar Dos minutos cuentan" })
      .click();
    await page
      .getByRole("checkbox", { name: "Usé mi señal para empezar" })
      .check();
    await page
      .getByRole("checkbox", {
        name: "Me moví dos minutos según mi capacidad",
      })
      .check();
    await page
      .getByRole("button", { name: "Registrar mi primer inicio" })
      .click();
    await page
      .getByRole("button", { name: "Compartir con la comunidad" })
      .click();
    await page.goto("/");

    const card = page.getByTestId("public-habit-celebration");
    await expect(card).toHaveAttribute("data-pillar", "movement");
    await expect(card).toContainText("empezó a moverse");
    await expect(
      card.getByRole("link", { name: /Conocer Dos minutos cuentan/ }),
    ).toHaveAttribute("href", "/pilares/movimiento");
  });

  test("mind and community rewards presence without requiring a reply", async ({
    page,
  }) => {
    await page.goto("/pilares/mente-espiritu");
    await expect(
      page.getByRole("heading", { name: "Un vínculo consciente" }),
    ).toBeVisible();
    await expect(
      page.getByText("Soy una persona que cultiva vínculos reales"),
    ).toBeVisible();
    await expect(page.getByText(/pausa.*ruido digital/i).first()).toBeVisible();
    await expect(
      page.getByText(/la respuesta de la otra persona no es requisito/i),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Empezar Un vínculo consciente" })
      .click();
    await expect(page.getByText("0 de 7 vínculos")).toBeVisible();
    const cycleDates = await backdateAtomicSleepChallengeForSevenDayTest();
    await page.reload();
    for (const [index, cycleDate] of cycleDates.entries()) {
      await page
        .getByRole("checkbox", {
          name: "Hice una pausa lejos del ruido digital",
        })
        .check();
      await page
        .getByRole("checkbox", {
          name: "Envié un mensaje genuino y dejé espacio para escuchar",
        })
        .check();
      await page.locator('select[name="cycleDate"]').selectOption(cycleDate);
      await page
        .getByRole("button", {
          name:
            index === 0
              ? "Cultivar mi primer vínculo"
              : "Registrar este vínculo",
        })
        .click();
      await expect(page.getByText(`${index + 1} de 7 vínculos`)).toBeVisible();
    }
    await expect(
      page.getByRole("heading", {
        name: "Cultivaste cinco vínculos reales",
      }),
    ).toBeVisible();
    await expect(page.getByText("50 puntos").first()).toBeVisible();
  });

  test("a shared connection keeps Mind and Spirit colors without a popularity score", async ({
    page,
  }) => {
    await page.goto("/pilares/mente-espiritu");
    await page
      .getByRole("button", { name: "Empezar Un vínculo consciente" })
      .click();
    await page
      .getByRole("checkbox", {
        name: "Hice una pausa lejos del ruido digital",
      })
      .check();
    await page
      .getByRole("checkbox", {
        name: "Envié un mensaje genuino y dejé espacio para escuchar",
      })
      .check();
    await page
      .getByRole("button", { name: "Cultivar mi primer vínculo" })
      .click();
    await page
      .getByRole("button", { name: "Compartir con la comunidad" })
      .click();
    await page.goto("/");

    const card = page.getByTestId("public-habit-celebration");
    await expect(card).toHaveAttribute("data-pillar", "mind");
    await expect(card).toContainText("cultivó un vínculo real");
    await expect(
      card.getByRole("link", { name: /Conocer Un vínculo consciente/ }),
    ).toHaveAttribute("href", "/pilares/mente-espiritu");
    await expect(card).not.toContainText(/respuestas|popularidad/);
  });

  test("the weekly league shows its threshold instead of an empty ranking", async ({
    page,
  }) => {
    await page.goto("/habitos");
    const league = page.getByTestId("habit-league");
    await expect(league).toContainText(
      "0 de 10 participantes semanales activos",
    );
    await expect(league).toContainText("No mostramos una tabla vacía");
    await expect(
      league.getByRole("list", {
        name: "Clasificación semanal por constancia",
      }),
    ).toHaveCount(0);
  });

  test("the sleep practice is part of its pillar before references", async ({
    page,
  }) => {
    await page.goto("/pilares/sueno");

    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const pageTitle = page.getByRole("heading", {
      level: 1,
      name: "1. Sueño y Descanso",
    });
    const pageHero = pageTitle.locator("xpath=ancestor::header");
    await expect(pageHero).toContainText(
      "La base de la recuperación biológica y la salud a largo plazo.",
    );
    await expect(pageHero).toContainText(
      "Soy una persona que protege su descanso.",
    );
    const practice = page.getByRole("heading", {
      level: 2,
      name: "Del atardecer al amanecer",
    });
    await expect(practice).toBeVisible();

    const precedesReferences = await practice.evaluate((heading) => {
      const section = heading.closest("section");
      const references = [...document.querySelectorAll("h3")]
        .find((candidate) => candidate.textContent?.trim() === "Referencias")
        ?.closest("section");
      return Boolean(
        section &&
          references &&
          section.compareDocumentPosition(references) &
            Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(precedesReferences).toBe(true);
  });

  test("the remaining pillars embed a specific ritual before references", async ({
    page,
  }) => {
    const pillars = [
      [
        "/pilares/alimentacion",
        "Una planta más",
        "Soy una persona que hace fácil elegir comida real",
        "Elegir, preparar, sumar y notar",
      ],
      [
        "/pilares/movimiento",
        "Dos minutos cuentan",
        "Soy una persona que empieza a moverse",
        "Preparar, empezar, moverse y notar",
      ],
      [
        "/pilares/mente-espiritu",
        "Un vínculo consciente",
        "Soy una persona que cultiva vínculos reales",
        "Pausar, elegir, contactar, escuchar y agradecer",
      ],
    ] as const;

    for (const [path, challenge, identity, ritual] of pillars) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        /Alimentación|Movimiento|Emociones/,
      );
      await expect(page.getByText(identity)).toBeVisible();
      const practice = page.getByRole("heading", { level: 2, name: challenge });
      await expect(practice).toBeVisible();
      const ritualSection = page
        .getByRole("heading", { level: 2, name: ritual })
        .locator("xpath=ancestor::section");
      await expect(ritualSection.getByRole("listitem")).toHaveCount(5);

      const precedesReferences = await practice.evaluate((heading) => {
        const practiceSection = heading.closest("section");
        const references = [...document.querySelectorAll("h3")]
          .find((heading) => heading.textContent?.trim() === "Referencias")
          ?.closest("section");
        return Boolean(
          practiceSection &&
            references &&
            practiceSection.compareDocumentPosition(references) &
              Node.DOCUMENT_POSITION_FOLLOWING,
        );
      });

      expect(precedesReferences, path).toBe(true);
    }
  });

  test("habit pages use plain language instead of implementation terms", async ({
    page,
  }) => {
    const routes = [
      ["/habitos", /at[oó]mico|external_id|puerto de env[ií]o|onboarding/i],
      [
        "/pilares/sueno",
        /at[oó]mico|external_id|puerto de env[ií]o|onboarding/i,
      ],
      [
        "/pilares/alimentacion",
        /at[oó]mico|external_id|puerto de env[ií]o|onboarding/i,
      ],
      [
        "/pilares/movimiento",
        /at[oó]mico|external_id|puerto de env[ií]o|onboarding/i,
      ],
      [
        "/pilares/mente-espiritu",
        /at[oó]mico|external_id|puerto de env[ií]o|onboarding/i,
      ],
      ["/en/habits", /atomic|external_id|sending port|onboarding/i],
      ["/en/pillars/sueno", /atomic|external_id|sending port|onboarding/i],
      [
        "/en/pillars/alimentacion",
        /atomic|external_id|sending port|onboarding/i,
      ],
      ["/en/pillars/movimiento", /atomic|external_id|sending port|onboarding/i],
      [
        "/en/pillars/mente-espiritu",
        /atomic|external_id|sending port|onboarding/i,
      ],
    ] as const;

    for (const [path, internalTerms] of routes) {
      await page.goto(path);
      await expect(page.getByRole("main").last(), path).not.toContainText(
        internalTerms,
      );
      if (path === "/habitos") {
        await expect(
          page.getByRole("heading", { name: "Recordatorios de Telegram" }),
        ).toBeVisible();
        await expect(
          page.getByText("Los recordatorios estarán disponibles más adelante."),
        ).toBeVisible();
      }
    }
  });
});

test("starting without a session preserves each pillar destination", async ({
  page,
}) => {
  const pillars = [
    ["/pilares/sueno", "/auth/signin?callbackUrl=%2Fpilares%2Fsueno"],
    [
      "/pilares/alimentacion",
      "/auth/signin?callbackUrl=%2Fpilares%2Falimentacion",
    ],
    ["/pilares/movimiento", "/auth/signin?callbackUrl=%2Fpilares%2Fmovimiento"],
    [
      "/pilares/mente-espiritu",
      "/auth/signin?callbackUrl=%2Fpilares%2Fmente-espiritu",
    ],
  ] as const;

  for (const [path, callback] of pillars) {
    await page.goto(path);
    await expect(
      page.getByRole("link", { name: "Inicia sesión para empezar" }),
    ).toHaveAttribute("href", callback);
  }
});

test("the unpublished habit detail URLs no longer exist or redirect", async ({
  request,
}) => {
  for (const path of [
    "/habitos/sueno",
    "/en/habits/sleep",
    "/habitos/alimentacion",
    "/en/habits/nutrition",
    "/habitos/movimiento",
    "/en/habits/movement",
    "/habitos/mente-espiritu",
    "/en/habits/mind-spirit",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.status(), path).toBe(404);
  }
});

async function completeFirstCycle(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.goto("/pilares/sueno");
  await page
    .getByRole("button", { name: "Empezar Del atardecer al amanecer" })
    .click();
  await page.getByRole("checkbox").nth(0).check();
  await page.getByRole("checkbox").nth(1).check();
  await page.getByRole("button", { name: "Completar mi primer ciclo" }).click();
  await expect(
    page.getByRole("heading", { name: "Tu semilla despertó" }),
  ).toBeVisible();
}
