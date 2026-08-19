import { expect, test } from "@playwright/test";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { type SeedPostInput, seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { testSlug } from "../testUtils/testSlug";

const stamp = Date.now();

function eventPost(overrides: Partial<SeedPostInput> = {}): SeedPostInput {
  return {
    title: `Meditacion guiada en el parque ${stamp}`,
    slug: testSlug("meditacion-guiada-asistencia"),
    kind: "evento",
    origin: null,
    price: null,
    startsAt: new Date("2027-08-23T07:30:00Z"),
    ...overrides,
  };
}

test.describe("When a visitor wants to attend an event", () => {
  const seededSlugs: string[] = [];
  let dbSession: DbSession | undefined;

  test.afterEach(async () => {
    if (dbSession?.id) await deleteSession(dbSession.id);
    dbSession = undefined;

    for (const slug of seededSlugs) await deleteOnePostBySlug(slug);
    seededSlugs.length = 0;
  });

  test("Then an anonymous visitor is sent to sign in first", async ({
    page,
  }) => {
    const post = eventPost();
    seededSlugs.push(post.slug);
    await seedPost(post);

    await page.goto(`/${post.slug}`);

    const link = page.getByTestId("event-attendance-signin");
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      "href",
      `/auth/signin?callbackUrl=%2F${post.slug}`,
    );

    await link.click();
    await expect(page).toHaveURL(
      new RegExp(`/auth/signin\\?callbackUrl=%2F${post.slug}$`),
    );
  });

  test("Then a signed-in visitor opens WhatsApp with the event identified", async ({
    page,
    browserName,
  }) => {
    dbSession = await simulateLogin(page, browserName);
    const post = eventPost();
    seededSlugs.push(post.slug);
    await seedPost(post);

    await page.goto(`/${post.slug}`);

    const link = page.getByTestId("event-attendance-whatsapp");
    await expect(link).toBeVisible();

    const href = await link.getAttribute("href");
    expect(href?.startsWith("https://wa.me/522781092116?text=")).toBe(true);

    const message = decodeURIComponent(href?.split("text=")[1] ?? "");
    expect(message).toContain(post.title);
    expect(message).toContain("2027");
    expect(message).toContain(post.slug);
  });

  test("Then a signed-in visitor confirms and cancels attendance", async ({
    page,
    browserName,
  }) => {
    dbSession = await simulateLogin(page, browserName);
    const post = eventPost();
    seededSlugs.push(post.slug);
    await seedPost(post);

    await page.goto(`/${post.slug}`);

    const button = page.getByTestId("event-attendance-toggle");
    const count = page.getByTestId("event-attendance-count");

    await expect(button).toHaveText(/Voy a asistir/);
    await expect(count).toHaveText("Nadie ha confirmado asistencia");

    await button.click();
    await expect(count).toHaveText("1 persona va a asistir");
    await expect(button).toHaveText(/Ya no voy/);

    await page.reload();
    await expect(count).toHaveText("1 persona va a asistir");
    await expect(button).toHaveText(/Ya no voy/);

    await button.click();
    await expect(count).toHaveText("Nadie ha confirmado asistencia");
    await expect(button).toHaveText(/Voy a asistir/);
  });

  test("Then only events show the sign-in attend action before login", async ({
    page,
  }) => {
    const posts: SeedPostInput[] = [
      eventPost({ slug: testSlug("evento-sin-telefono"), contactPhone: "" }),
      {
        title: `Jugo Verde ${stamp}`,
        slug: testSlug("jugo-verde-asistencia"),
        kind: "producto",
        origin: "hazlo_sano_propio",
      },
      {
        title: `Masaje relajante 30 minutos ${stamp}`,
        slug: testSlug("masaje-asistencia"),
        kind: "servicio",
        origin: null,
        durationMinutes: 30,
      },
    ];

    for (const post of posts) {
      seededSlugs.push(post.slug);
      await seedPost(post);
      await page.goto(`/${post.slug}`);

      await expect(page.getByTestId("event-attendance-whatsapp")).toHaveCount(
        0,
      );
      await expect(page.getByTestId("event-attendance-signin")).toHaveCount(
        post.kind === "evento" ? 1 : 0,
      );
    }
  });
});
