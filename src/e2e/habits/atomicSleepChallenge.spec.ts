import { expect, test } from "@playwright/test";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "~/e2e/testUtils/simulateLogin";
import {
  backdateHabitChallengeForSevenDayTest,
  clearHabitMilestoneMarker,
  countSleepRepetitions,
  countStartedHabitRituals,
  deleteHabitChallengeTestData,
  readSuiteAccountDisplayName,
} from "./testData";

const HABIT_COMMUNITY_PATH = "/pilares";

test.describe("Del atardecer al amanecer", () => {
  let session: DbSession | null = null;

  test.beforeEach(async ({ page, browserName }) => {
    await deleteHabitChallengeTestData();
    session = await simulateLogin(page, browserName);
  });

  test.afterEach(async () => {
    await deleteHabitChallengeTestData();
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

    await page.goto(HABIT_COMMUNITY_PATH);
    await expect(celebration).toHaveCount(0);
    await page.goto("/pilares/sueno");
    await shareWithCommunity(page);
    await page.goto(HABIT_COMMUNITY_PATH);

    await expect(celebration).toBeVisible();
    await expect(
      page.getByText("Nuevo logro comunitario", { exact: false }),
    ).toBeVisible();
    const afterGarden = await celebration.evaluate((card) => {
      const garden = document.querySelector(
        '[data-testid="community-habit-garden"]',
      );
      return Boolean(
        garden &&
          garden.compareDocumentPosition(card) &
            Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
    expect(afterGarden).toBe(true);

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
    await page.goto(HABIT_COMMUNITY_PATH);
    await expect(celebration).toBeVisible();

    await page.goto("/pilares/sueno");
    await withdrawFromCommunity(page);
    await page.goto(HABIT_COMMUNITY_PATH);
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
    await shareWithCommunity(page);

    await page.goto("/pilares/alimentacion");
    await page
      .getByRole("button", { name: "Empezar Cena real, local y al atardecer" })
      .click();
    await page.getByRole("checkbox", { name: "Cené al atardecer" }).check();
    await page
      .getByRole("checkbox", { name: "Serví la triada con una planta más" })
      .check();
    await page
      .getByRole("button", { name: "Cultivar mi primera cena" })
      .click();
    await shareWithCommunity(page);
    await page.goto(HABIT_COMMUNITY_PATH);

    const suiteCelebrations = page
      .getByTestId("public-habit-celebration")
      .filter({ hasText: suiteDisplayName });
    await expect(suiteCelebrations).toHaveCount(2);
    await expect(
      suiteCelebrations.filter({
        has: page.getByRole("link", {
          name: /Conocer Cena real, local y al atardecer/,
        }),
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
    await page
      .getByRole("button", { name: "Empezar Cena real, local y al atardecer" })
      .click();
    await page.getByRole("checkbox", { name: "Cené al atardecer" }).check();
    await page
      .getByRole("checkbox", { name: "Serví la triada con una planta más" })
      .check();
    await page
      .getByRole("button", { name: "Cultivar mi primera cena" })
      .click();
    await clearHabitMilestoneMarker("nutrition-one-plant-v1", "first_cycle");

    await shareWithCommunity(page);
    await page.goto(HABIT_COMMUNITY_PATH);

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
    await expect(page.getByText(/^0 de \d+ ciclos$/)).toBeVisible();
    const cycleDates = await backdateHabitChallengeForSevenDayTest();
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
    /* La advertencia de que esto todavía no es un hábito está; su redacción se afina y una prueba
       que la transcribe se cae en cada retoque. */
    await expect(page.getByTestId("habit-no-claim")).toBeVisible();
    expect(await countSleepRepetitions()).toBe(5);

    await shareWithCommunity(page);
    await withdrawFromCommunity(page);
    await expect(page.getByText("50 puntos").first()).toBeVisible();
    await expect(page.getByText("Cosecha de descanso")).toBeVisible();
  });

  test("shared repetitions grow the aggregate garden and can be withdrawn", async ({
    page,
  }) => {
    await completeFirstCycle(page);
    await page.goto(HABIT_COMMUNITY_PATH);
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
    await page.goto(HABIT_COMMUNITY_PATH);
    await expect(sleepPlot.locator("strong")).toHaveText(String(before + 1));

    await page.goto("/pilares/sueno");
    await page
      .getByRole("button", { name: "Retirar mis repeticiones del jardín" })
      .click();
    await expect(
      page.getByRole("button", { name: "Aportar mis repeticiones al jardín" }),
    ).toBeVisible();
    await page.goto(HABIT_COMMUNITY_PATH);
    await expect(sleepPlot.locator("strong")).toHaveText(String(before));
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
    await expect(page.getByText(/^1 de \d+ ciclos$/)).toBeVisible();

    await page.goto("/pilares/alimentacion");
    await expect(page).toHaveURL(/\/pilares\/alimentacion$/);
    await page
      .getByRole("button", { name: "Empezar Cena real, local y al atardecer" })
      .click();
    await expect(page.getByText(/^0 de \d+ cenas$/)).toBeVisible();
    await page.getByRole("checkbox", { name: "Cené al atardecer" }).check();
    await page
      .getByRole("checkbox", { name: "Serví la triada con una planta más" })
      .check();
    await page
      .getByRole("button", { name: "Cultivar mi primera cena" })
      .click();
    await expect(page.getByText(/^1 de \d+ cenas$/)).toBeVisible();

    expect(await countStartedHabitRituals()).toBe(2);
    await page.goto("/pilares/sueno");
    await expect(page.getByText(/^1 de \d+ ciclos$/)).toBeVisible();
    await expect(page.getByText("10 puntos").first()).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: "Continuar con mi semana de descanso",
      }),
    ).toHaveCount(0);

    await page.goto("/en/pillars/alimentacion");
    await expect(
      page.getByRole("heading", {
        name: "A real, local dinner at sunset",
      }),
    ).toBeVisible();
    /* La práctica del pilar cerraba con un botón de recordatorios permanentemente deshabilitado:
       prometía algo que la página no puede dar. El aviso sigue en el índice de Hábitos, que es donde
       se anuncia lo que viene; dentro del pilar no vuelve. */
    await expect(
      page.getByRole("button", { name: "Telegram reminders unavailable" }),
    ).toHaveCount(0);
  });

  test("nutrition becomes a complete orange ritual with a five-of-seven harvest", async ({
    page,
  }) => {
    await page.goto("/pilares/alimentacion");
    await expect(
      page.getByRole("heading", {
        name: "Cena real, local y al atardecer",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Soy una persona que hace fácil elegir comida real, fresca y de origen local",
      ),
    ).toBeVisible();
    /* Por rol y no por texto suelto: «Cenar al atardecer» abre tambien el puente con Sueño,
       y el ancla es lo que esta prueba vigila. */
    await expect(
      page.getByRole("heading", { name: "Cenar al atardecer" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Servir la triada local" }),
    ).toBeVisible();
    await expect(
      page.getByText(/a granel y en tus propios frascos/i),
    ).toBeVisible();
    /* El ancla temporal se enuncia con la hora y con la regla relativa. La hora sola deja fuera a
       quien trabaja de noche; la regla sola no dice cuándo empezar hoy.

       `.first()` no es descuido: la hora aparece dos veces a propósito —en el ancla y en el segundo
       paso del ritual—, y sin él el modo estricto de Playwright falla por ambigüedad en vez de por
       la ausencia que esto vigila. Lo mismo con el abastecimiento, que es nota de preparación y
       primer paso. */
    await expect(
      page.getByText(/entre las 6:00 y las 7:30 PM/).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/2\.5 a 3 horas antes de dormir/),
    ).toBeVisible();
    /* El ritual abre en el mercado y cierra en el triple impacto: si volviera a leer cinco pasos,
       el que cierra la práctica desaparecería en silencio. */
    await expect(page.getByText(/Abastecerte cerca/).first()).toBeVisible();
    await expect(page.getByText(/Notar el triple impacto/)).toBeVisible();

    await page
      .getByRole("button", { name: "Empezar Cena real, local y al atardecer" })
      .click();
    await expect(page.getByText(/^0 de \d+ cenas$/)).toBeVisible();
    const cycleDates = await backdateHabitChallengeForSevenDayTest(
      "nutrition-one-plant-v1",
    );
    await page.reload();
    for (const [index, cycleDate] of cycleDates.entries()) {
      await page.getByRole("checkbox", { name: "Cené al atardecer" }).check();
      await page
        .getByRole("checkbox", { name: "Serví la triada con una planta más" })
        .check();
      await page.locator('select[name="cycleDate"]').selectOption(cycleDate);
      await page
        .getByRole("button", {
          name:
            cycleDate === cycleDates[0]
              ? "Cultivar mi primera cena"
              : "Registrar esta cena",
        })
        .click();
      await expect(page.getByText(`${index + 1} de 7 cenas`)).toBeVisible();
    }

    await expect(
      page.getByRole("heading", {
        name: "Cultivaste cinco cenas reales",
      }),
    ).toBeVisible();
    await expect(page.getByText("5 de 7 cenas")).toBeVisible();
    await expect(page.getByText("50 puntos").first()).toBeVisible();
  });

  test("a shared nutrition milestone keeps nutrition text, design and destination", async ({
    page,
  }) => {
    const suiteDisplayName = await readSuiteAccountDisplayName();
    await page.goto("/pilares/alimentacion");
    await page
      .getByRole("button", { name: "Empezar Cena real, local y al atardecer" })
      .click();
    await page.getByRole("checkbox", { name: "Cené al atardecer" }).check();
    await page
      .getByRole("checkbox", { name: "Serví la triada con una planta más" })
      .check();
    await page
      .getByRole("button", { name: "Cultivar mi primera cena" })
      .click();
    await shareWithCommunity(page);
    await page.goto(HABIT_COMMUNITY_PATH);

    /* La tarjeta de la suite, no «la» tarjeta: el feed es comunitario y la base la comparten tres
       proyectos, así que cualquier cuenta real con una celebración compartida hacía fallar esto por
       ambigüedad. Es el mismo filtro por nombre que usan los escenarios de arriba. */
    const card = page
      .getByTestId("public-habit-celebration")
      .filter({ hasText: suiteDisplayName });
    await expect(card).toHaveAttribute("data-pillar", "nutrition");
    /* El TÍTULO y no el cuerpo: la tarjeta del feed es la variante `compact`, que desde
       `a528a52` («reduce spacing…») se queda con encabezado, título y enlace. El cuerpo
       —«cultivó su primera cena real»— solo lo pinta la variante `full`. El título distingue
       igual el primer hito del final, que es lo que este escenario comprueba. */
    await expect(card).toContainText("hizo fácil cenar comida real y local");
    await expect(
      card.getByRole("link", {
        name: /Conocer Cena real, local y al atardecer/,
      }),
    ).toHaveAttribute("href", "/pilares/alimentacion");
    await expect(page.getByText(/primera cena real/).first()).toBeVisible();
  });

  test("movement turns two minutes into a green ritual without volume scoring", async ({
    page,
  }) => {
    await page.goto("/pilares/movimiento");
    await expect(
      page.getByRole("heading", {
        name: "Movimiento vivo, local y funcional",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Soy una persona que se mueve de forma natural y reconecta con su entorno y comunidad todos los días",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(/calzado junto a la puerta y la bici lista/i),
    ).toBeVisible();
    await expect(
      page.getByText(/los puntos cuentan días, no volumen/i).first(),
    ).toBeVisible();
    /* El mínimo es un piso, no un techo: la copia dice las dos cosas —alargarlo te conviene, y
       alargarlo no da más puntos— y esta afirmación existe para que sigan juntas. */
    await expect(
      page.getByText(/le hace bien a tu cuerpo/i).first(),
    ).toBeVisible();
    /* El ancla sin motor no puede leerse como un requisito de caminar. Aparece dos veces a
       propósito —en el ancla y en la nota de seguridad— y de ahí el `.first()`: la accesibilidad
       tiene que llegar antes de la letra pequeña, no solo dentro de ella. */
    await expect(
      page.getByText(/silla, muletas o bastón/i).first(),
    ).toBeVisible();

    await page
      .getByRole("button", {
        name: "Empezar Movimiento vivo, local y funcional",
      })
      .click();
    await expect(page.getByText(/^0 de \d+ días$/)).toBeVisible();
    const cycleDates = await backdateHabitChallengeForSevenDayTest(
      "movement-two-minutes-v1",
    );
    await page.reload();
    for (const [index, cycleDate] of cycleDates.entries()) {
      await page.getByRole("checkbox", { name: "Me moví sin motor" }).check();
      await page
        .getByRole("checkbox", {
          name: "Me moví dos minutos según mi capacidad",
        })
        .check();
      await page.locator('select[name="cycleDate"]').selectOption(cycleDate);
      await page
        .getByRole("button", {
          name: index === 0 ? "Registrar mi primer día" : "Registrar este día",
        })
        .click();
      await expect(page.getByText(`${index + 1} de 7 días`)).toBeVisible();
    }
    await expect(
      page.getByRole("heading", { name: "Moviste tu semana cinco veces" }),
    ).toBeVisible();
    await expect(page.getByText("50 puntos").first()).toBeVisible();
  });

  test("a shared movement milestone links back to Movement", async ({
    page,
  }) => {
    const suiteDisplayName = await readSuiteAccountDisplayName();
    await page.goto("/pilares/movimiento");
    await page
      .getByRole("button", {
        name: "Empezar Movimiento vivo, local y funcional",
      })
      .click();
    await page.getByRole("checkbox", { name: "Me moví sin motor" }).check();
    await page
      .getByRole("checkbox", {
        name: "Me moví dos minutos según mi capacidad",
      })
      .check();
    await page.getByRole("button", { name: "Registrar mi primer día" }).click();
    await shareWithCommunity(page);
    await page.goto(HABIT_COMMUNITY_PATH);

    /* La tarjeta de la suite, no «la» tarjeta: el feed es comunitario y la base la comparten tres
       proyectos, así que cualquier cuenta real con una celebración compartida hacía fallar esto por
       ambigüedad. Es el mismo filtro por nombre que usan los escenarios de arriba. */
    const card = page
      .getByTestId("public-habit-celebration")
      .filter({ hasText: suiteDisplayName });
    await expect(card).toHaveAttribute("data-pillar", "movement");
    // El título, no el cuerpo: la variante `compact` del feed no lo pinta (ver el de nutrición).
    await expect(card).toContainText("se movió sin motor");
    await expect(
      card.getByRole("link", {
        name: /Conocer Movimiento vivo, local y funcional/,
      }),
    ).toHaveAttribute("href", "/pilares/movimiento");
  });

  test("mind and community rewards presence without requiring a reply", async ({
    page,
  }) => {
    await page.goto("/pilares/mente-espiritu");
    await expect(
      page.getByRole("heading", {
        name: "Presencia, paz y conexión local",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Soy una persona que cultiva la paz interior, la presencia y lazos sólidos con su comunidad todos los días",
      ),
    ).toBeVisible();
    /* Por rol: «Abrir el día sin pantalla» es tambien el titulo de la primera ventana de
       silencio, y el ancla es lo que esta prueba vigila. */
    await expect(
      page.getByRole("heading", { name: "Abrir el día sin pantalla" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Presencia con alguien" }),
    ).toBeVisible();
    /* El minimo empuja a lo presencial sin dejar fuera a quien hoy no tiene a nadie cerca. */
    await expect(
      page.getByText(/una llamada o un mensaje sincero cuentan igual/i),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Empezar Presencia, paz y conexión local" })
      .click();
    await expect(page.getByText(/^0 de \d+ días$/)).toBeVisible();
    const cycleDates = await backdateHabitChallengeForSevenDayTest(
      "mind-one-connection-v1",
    );
    await page.reload();
    for (const [index, cycleDate] of cycleDates.entries()) {
      await page
        .getByRole("checkbox", {
          name: "Abrí el día sin pantalla",
        })
        .check();
      await page
        .getByRole("checkbox", {
          name: "Le di presencia real a alguien",
        })
        .check();
      await page.locator('select[name="cycleDate"]').selectOption(cycleDate);
      await page
        .getByRole("button", {
          name: index === 0 ? "Registrar mi primer día" : "Registrar este día",
        })
        .click();
      await expect(page.getByText(`${index + 1} de 7 días`)).toBeVisible();
    }
    await expect(
      page.getByRole("heading", {
        name: "Sostuviste cinco días de presencia",
      }),
    ).toBeVisible();
    await expect(page.getByText("50 puntos").first()).toBeVisible();
  });

  test("a shared connection keeps Mind and Spirit colors without a popularity score", async ({
    page,
  }) => {
    const suiteDisplayName = await readSuiteAccountDisplayName();
    await page.goto("/pilares/mente-espiritu");
    await page
      .getByRole("button", { name: "Empezar Presencia, paz y conexión local" })
      .click();
    await page
      .getByRole("checkbox", {
        name: "Abrí el día sin pantalla",
      })
      .check();
    await page
      .getByRole("checkbox", {
        name: "Le di presencia real a alguien",
      })
      .check();
    await page.getByRole("button", { name: "Registrar mi primer día" }).click();
    await shareWithCommunity(page);
    await page.goto(HABIT_COMMUNITY_PATH);

    /* La tarjeta de la suite, no «la» tarjeta: el feed es comunitario y la base la comparten tres
       proyectos, así que cualquier cuenta real con una celebración compartida hacía fallar esto por
       ambigüedad. Es el mismo filtro por nombre que usan los escenarios de arriba. */
    const card = page
      .getByTestId("public-habit-celebration")
      .filter({ hasText: suiteDisplayName });
    await expect(card).toHaveAttribute("data-pillar", "mind");
    // El título, no el cuerpo: la variante `compact` del feed no lo pinta (ver el de nutrición).
    await expect(card).toContainText("abrió su día en calma");
    await expect(
      card.getByRole("link", {
        name: /Conocer Presencia, paz y conexión local/,
      }),
    ).toHaveAttribute("href", "/pilares/mente-espiritu");
    await expect(card).not.toContainText(/respuestas|popularidad/);
  });

  test("the weekly league shows its threshold instead of an empty ranking", async ({
    page,
  }) => {
    await page.goto("/habitos");
    const league = page.getByTestId("habit-league");
    /* Sin fijar el número: la base la comparten tres proyectos y cuentas reales, así que cuántas
       personas hay apuntadas esta semana no es asunto de la suite. Lo que se prueba es que debajo
       del umbral se explique la condición en vez de pintar una clasificación vacía. */
    await expect(league).toContainText(
      /\d+ de 10 participantes semanales activos/,
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
      name: "1. Sueño y descanso profundo",
    });
    const pageHero = pageTitle.locator("xpath=ancestor::header");
    await expect(pageHero).toContainText(
      "Volver a dormir al ritmo de la luz, no al de las pantallas.",
    );
    await expect(pageHero).toContainText(
      "Soy una persona que respeta los ritmos naturales de su cuerpo y se regala un descanso profundo y reparador cada noche",
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
        "Cena real, local y al atardecer",
        "Soy una persona que hace fácil elegir comida real, fresca y de origen local",
        "Abastecer, anclar, cocinar, servir, estar y notar",
        6,
      ],
      [
        "/pilares/movimiento",
        "Movimiento vivo, local y funcional",
        "Soy una persona que se mueve de forma natural y reconecta con su entorno y comunidad todos los días",
        "Salir, pausar, asolearse, fortalecer y notar",
        5,
      ],
      [
        "/pilares/mente-espiritu",
        "Presencia, paz y conexión local",
        "Soy una persona que cultiva la paz interior, la presencia y lazos sólidos con su comunidad todos los días",
        "Callar, salir, conversar, agradecer y notar",
        5,
      ],
    ] as const;

    /* El número de pasos entra por pilar y no como constante: Alimentación cerró su ritual con un
       sexto paso —notar el triple impacto— y los otros dos siguen en cinco. Afirmar «cinco» para
       los tres volvía a atar la prueba a una redacción que ya no es la de todos. */
    for (const [path, challenge, identity, ritual, steps] of pillars) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        /Alimentación|Movimiento|Mente/,
      );
      await expect(page.getByText(identity)).toBeVisible();
      const practice = page.getByRole("heading", { level: 2, name: challenge });
      await expect(practice).toBeVisible();
      const ritualSection = page
        .getByRole("heading", { level: 2, name: ritual })
        .locator("xpath=ancestor::section");
      await expect(ritualSection.getByRole("listitem"), path).toHaveCount(
        steps,
      );

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

/**
 * Cada URL se pide desde un contexto nuevo, y no reutilizando el `request` de la prueba.
 *
 * El contexto guarda cookies entre peticiones, así que pedir una URL en inglés dejaba puesta
 * `NEXT_LOCALE=en` y la siguiente URL en español respondía 307 hacia su prefijo inglés. La prueba
 * afirmaba entonces algo que nadie vive: quien llega a una de estas URL no trae la cookie del
 * idioma contrario puesta por la petición anterior.
 */
test("the unpublished habit detail URLs no longer exist or redirect", async ({
  playwright,
  baseURL,
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
    const context = await playwright.request.newContext({ baseURL });
    const response = await context.get(path, { maxRedirects: 0 });

    expect(response.status(), path).toBe(404);
    await context.dispose();
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

async function shareWithCommunity(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page
    .getByRole("button", { name: "Compartir con la comunidad" })
    .click();
  await expect(
    page.getByRole("button", { name: "Dejar de compartir" }),
  ).toBeVisible();
}

async function withdrawFromCommunity(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.getByRole("button", { name: "Dejar de compartir" }).click();
  await expect(
    page.getByRole("button", { name: "Compartir con la comunidad" }),
  ).toBeVisible();
}
