import { expect, test } from "@playwright/test";
import { dummyDbUser } from "../dummies/session";
import { deleteCommentsByPostSlug } from "../testUtils/deleteComments";
import {
  type DbSession,
  deleteSession,
  simulateLogin,
} from "../testUtils/simulateLogin";
import CommentPage from "./CommentPage";

// test.use({
//   storageState: './src/e2e/.auth/auth.json'
// });

test.describe
  .skip("Given an authenticated user viewing a post", () => {
    let commentPage: CommentPage;
    let dbSession: DbSession | undefined;
    const postSlug = "verduras-y-semillas-frescas";

    test.beforeEach(async ({ page, browserName }) => {
      dbSession = await simulateLogin(page, browserName);
      commentPage = new CommentPage(page);
      await commentPage.goToPost(postSlug);
    });

    test.afterEach(async () => {
      if (dbSession?.id) {
        await deleteSession(dbSession?.id);
        await deleteCommentsByPostSlug(postSlug);
      }
    });

    test.describe("When the user writes a comment", () => {
      test("Then the comment should appear with the user's name", async () => {
        const comment = "Esta ensalada se ve deliciosa!";

        await commentPage.fillComment(comment);
        await commentPage.submitComment();

        await commentPage.verifyCommentDisplayed(comment);
        await commentPage.verifyCommentAuthor(dummyDbUser.name);
      });
    });
  });
