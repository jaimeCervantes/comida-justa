import { type PlaywrightTestArgs, test } from "@playwright/test";
import PublishPage from "./PublishPage";

test.describe
  .skip("When an user creates a post about healthy Post", () => {
    test("Then a healthy score of the post is calculated using AI", async ({
      page,
    }: PlaywrightTestArgs) => {
      const publishPage = new PublishPage(page);
      await publishPage.goToPublish();
      await publishPage.fillFields({
        title: "Ensalada griega",
        description: `La ensalada griega es una opción saludable y deliciosa para el desayuno o como plato principal en un menú diario.`,
        price: "80",
        phone: "2781092116",
        file: "./src/e2e/dummies/post.jpg",
      });
      await publishPage.verifyForm();

      await publishPage.send();

      await publishPage.verifyScore();
    });
  });
