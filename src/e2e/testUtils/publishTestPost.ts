import type { Page } from "@playwright/test";
import PublishPage from "../createPost/PublishPage";

export async function publishTestPost(page: Page) {
  const time = new Date().getTime();
  const slug = "ensalada-griega-" + time;

  const publishPage = new PublishPage(page);
  const postTitle = "Ensalada griega " + time;

  await publishPage.stubStorageUpload();
  await publishPage.fillFields({
    title: postTitle,
    description: `La ensalada griega es una opción saludable y deliciosa para el desayuno o como plato principal en un menú diario.`,
    price: "80",
    phone: "2781092116",
    file: "./src/e2e/dummies/post.jpg",
  });

  await publishPage.verifyForm();
  await publishPage.send();
  return slug;
}
