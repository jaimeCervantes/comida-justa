import type { Page } from "@playwright/test";
import PublishPage from "../createPost/PublishPage";
import { testPost } from "./testSlug";

export async function publishTestPost(page: Page) {
  // El slug lo deriva la app del título; `testPost` lo calcula con el mismo código, así que el
  // barrido puede reconocer esta publicación aunque el test muera antes de borrarla.
  const { title: postTitle, slug } = testPost("Ensalada griega");

  const publishPage = new PublishPage(page);

  await publishPage.stubStorageUpload();
  await publishPage.fillFields({
    title: postTitle,
    description: `La ensalada griega es una opción saludable y deliciosa para el desayuno o como plato principal en un menú diario.`,
    price: "80",
    phone: '2781092116',
    file: "./src/e2e/dummies/post.jpg",
  });

  await publishPage.verifyForm();
  await publishPage.send();
  return slug;
}