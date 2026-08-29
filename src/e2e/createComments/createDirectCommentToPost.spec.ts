import { expect, test } from "@playwright/test";
import { deleteCommentsByPostSlug } from "../testUtils/deleteComments";
import { deleteOnePostBySlug } from "../testUtils/deleteOnePost";
import { seedPost } from "../testUtils/seedPost";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import { findSuiteUserName } from "../testUtils/suiteAccount";
import { testSlug } from "../testUtils/testSlug";
import CommentPage from "./CommentPage";

/**
 * Writing a comment, end to end.
 *
 * This suite was `.skip`ped with no reason written down, and it pointed at a hardcoded slug
 * (`verduras-y-semillas-frescas`) nobody seeded — so it could only ever have passed on a machine
 * whose shared database happened to hold that publication. It now seeds its own and cleans up,
 * like every other suite here.
 *
 * Turning it back on is not housekeeping: the action that writes a comment stopped taking the
 * author from the browser and now reads it from the session. Every unit test around that change
 * mocks `auth()`, so **nothing proved that a real signed-in person can still comment** — and a
 * security fix that silently breaks the honest path is a worse outcome than the hole it closed.
 * That is what this scenario is for: it drives the browser, and the name under the comment is the
 * session's, which is the whole point of the change.
 */
test.describe("Given an authenticated user viewing a post", () => {
  let commentPage: CommentPage;
  let dbSession: DbSession | undefined;
  const postSlug = testSlug("ensalada-para-comentar");

  test.beforeEach(async ({ page, browserName }) => {
    await seedPost({
      title: "E2E Ensalada de verduras y semillas frescas",
      slug: postSlug,
      kind: "producto",
      origin: "productor",
      price: 75,
    });

    dbSession = await simulateLogin(page, browserName);
    commentPage = new CommentPage(page);
    await commentPage.goToPost(postSlug);
  });

  test.afterEach(async () => {
    await deleteCommentsByPostSlug(postSlug);
    await deleteOnePostBySlug(postSlug);

    if (dbSession?.id) await deleteSession(dbSession.id);
  });

  test.describe("When the user writes a comment", () => {
    test("Then the comment should appear with the user's name", async () => {
      const comment = "Esta ensalada se ve deliciosa!";

      await commentPage.fillComment(comment);
      await commentPage.submitComment();

      await commentPage.verifyCommentDisplayed(comment);

      /* The name is the assertion that matters now. It is never sent from the browser: the action
         reads it from the session, so seeing it here is seeing the server sign the comment.

         Read from the same row `simulateLogin` uses, never written by hand. It was written by hand
         once — `dummyDbUser`, "Jaime Cervantes" — and when the suite moved to the `pw.` account the
         assertion quietly started comparing against somebody who was no longer commenting. */
      await commentPage.verifyCommentAuthor(await findSuiteUserName());
    });

    /* The server is the one that refuses, and it has to say why. Before this slice the rule lived
       only in the browser, where it is a courtesy and not a defence. */
    test("Then a comment over 500 characters is refused, with a reason", async ({
      page,
    }) => {
      await commentPage.fillComment("a".repeat(501));
      await commentPage.submitComment();

      await expect(
        page.getByText(/no puede pasar de 500 caracteres/i),
      ).toBeVisible();
    });
  });
});
