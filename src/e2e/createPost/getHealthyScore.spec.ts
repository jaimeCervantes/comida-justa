import { test, type PlaywrightTestArgs, expect } from "@playwright/test";
import PublishPage from "./PublishPage";

test.describe("When an user creates a post about healthy Food", () => {
  test("Then a healthy score of the food is calculated using AI", async ({
    page,
  }: PlaywrightTestArgs) => {
    const publishPage = new PublishPage(page);
    await publishPage.goToPublish();
    await publishPage.fillFields({
      title: "Ensalada griega",
      description: `La ensalada griega es una opción saludable y deliciosa para el desayuno o como plato principal en un menú diario.`,
      price: "80",
      image: "./e2e/dummies/food.jpg",
    });
    await publishPage.verifyForm();

    await publishPage.send();

    await publishPage.verifyScore();
  });
});
